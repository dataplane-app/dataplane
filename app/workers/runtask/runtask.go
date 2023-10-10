package runtask

import (
	"bufio"
	"bytes"
	"context"
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"syscall"
	"time"

	modelmain "github.com/dataplane-app/dataplane/app/mainapp/database/models"
	"github.com/dataplane-app/dataplane/app/mainapp/messageq"

	"github.com/dataplane-app/dataplane/app/mainapp/database"
	wrkerconfig "github.com/dataplane-app/dataplane/app/workers/config"
	"github.com/dataplane-app/dataplane/app/workers/distfilesystem"
	"github.com/dataplane-app/dataplane/app/workers/mqworker"

	"github.com/google/uuid"
	cmap "github.com/orcaman/concurrent-map"
	clog "github.com/pieterclaerhout/go-log"
)

type Runner struct {
	Command string
}

// https://stackoverflow.com/questions/59607744/how-to-kill-running-goroutines-from-outside
type Task struct {
	ID      string
	PID     int
	Context context.Context
	Cancel  context.CancelFunc
}

// var Tasks = make(map[string]Task)
var Tasks = cmap.New()

// var TasksStatus = make(map[string]string)
var TasksStatus = cmap.New()

// Worker function to run task
func worker(ctx context.Context, msg modelmain.WorkerTaskSend) {

	// log.Println("Type:", msg.RunType, msg.Version)

	var statusUpdate string
	var TasksStatusWG string
	var TasksRun Task

	statusUpdate = "Run"

	TaskUpdate := modelmain.WorkerTasks{
		TaskID:        msg.TaskID,
		CreatedAt:     time.Now().UTC(),
		EnvironmentID: msg.EnvironmentID,
		RunID:         msg.RunID,
		NodeID:        msg.NodeID,
		PipelineID:    msg.PipelineID,
		WorkerGroup:   wrkerconfig.WorkerGroup,
		WorkerID:      wrkerconfig.WorkerID,
		StartDT:       time.Now().UTC(),
		Status:        statusUpdate,
	}

	if wrkerconfig.Debug == "true" {
		log.Printf("starting task with id %s - node: %s run: %s type: %s version: %s \n", msg.TaskID, msg.NodeID, msg.RunID, msg.RunType, msg.Version)
	}

	// lock node for run
	var createLock = modelmain.WorkerTaskLock{
		RunID:  msg.RunID,
		NodeID: msg.NodeID,
	}
	errl := database.DBConn.Create(&createLock).Error
	if errl != nil {
		if strings.Contains(errl.Error(), "duplicate") {
			if wrkerconfig.Debug == "true" {
				log.Println("Lock for run and node exists:", msg.RunID, msg.NodeID)
			}
		} else {
			log.Println(errl.Error())
		}

		log.Println("Lock for run and node exists:", msg.RunID, msg.NodeID)

		// == NB: this should be a silent fail and continue, the below will fail the entire graph
		SilentWSLogError("Lock for run and node exists:"+errl.Error(), msg)

		return
	}

	// --- Check if this task is already running
	var lockCheck modelmain.WorkerTasks
	err2 := database.DBConn.Select("task_id", "status").Where("task_id = ? and environment_id= ?", msg.TaskID, msg.EnvironmentID).First(&lockCheck).Error
	if err2 != nil {
		log.Println("Task already running", err2.Error())
		SilentWSLogError("Task already running:"+err2.Error(), msg)
		return
	}

	if lockCheck.Status != "Queue" {
		log.Println("Skipping not in queue", msg.RunID, msg.NodeID)
		SilentWSLogError("Skipping not in queue - runid:"+msg.RunID+" - node:"+msg.NodeID, msg)
		return
	}

	UpdateWorkerTasks(TaskUpdate)

	// --- Check if pipeline has failed
	var pipelineCheck modelmain.PipelineRuns
	err2 = database.DBConn.Select("run_id", "status").Where("run_id = ?", msg.RunID).First(&pipelineCheck).Error
	if err2 != nil {
		log.Println(err2.Error())
		WSLogError("Pipeline marked as failed - runid:"+msg.RunID+" - node:"+msg.NodeID, msg, TaskUpdate)
		return
	}

	if pipelineCheck.Status != "Running" {

		log.Println("Skipping pipeline not in running state", msg.RunID, msg.NodeID)

		WSLogError("Skipping pipeline not in running state - runid:"+msg.RunID+" - node:"+msg.NodeID, msg, TaskUpdate)

		TaskFinal := modelmain.WorkerTasks{
			TaskID:        msg.TaskID,
			EnvironmentID: wrkerconfig.EnvID,
			RunID:         msg.RunID,
			WorkerGroup:   msg.WorkerGroup,
			WorkerID:      wrkerconfig.WorkerID,
			NodeID:        msg.NodeID,
			PipelineID:    msg.PipelineID,
			Status:        "Fail",
			Reason:        "Pipeline not running",
			EndDT:         time.Now().UTC(),
		}
		UpdateWorkerTasks(TaskFinal)

		return
	}

	// ----- get data inputs -------
	ctxRedis := context.Background()
	redisData := modelmain.RedisAPIData{}
	if err := database.RedisConn.HGetAll(ctxRedis, "api-trigger-"+wrkerconfig.EnvID+"-"+msg.RunID).Scan(&redisData); err != nil {
		log.Println("Redis get leader error:", err)
	}

	for _, v := range msg.Commands {
		// Print the log timestamps
		clog.PrintTimestamp = true

		if tmp, ok := TasksStatus.Get(msg.TaskID); ok {
			TasksStatusWG = tmp.(string)
		}

		if TasksStatusWG == "cancel" {
			// delete(TasksStatus, msg.TaskID)
			TasksStatus.Remove(msg.TaskID)
			break
		}

		if TasksStatusWG == "error" {
			TasksStatus.Remove(msg.TaskID)
			break
		}

		// parentfolderdata := environmentID + "/pipelines/" + pipelineID
		// <-parentfolder

		// The folder structure will look like <environment ID>/pipelines/<pipeline ID>
		// log.Println("parent folder", parentfolderdata)
		codeDirectory := wrkerconfig.FSCodeDirectory
		directoryRun := ""
		if msg.RunType == "deployment" {
			directoryRun = filepath.Join(codeDirectory+msg.EnvironmentID, msg.RunType, msg.PipelineID, msg.Version, msg.NodeID)
		} else {
			directoryRun = filepath.Join(codeDirectory+msg.EnvironmentID, msg.RunType, msg.PipelineID, msg.NodeID)
		}

		var errfs error
		switch wrkerconfig.FSCodeFileStorage {
		case "Database":
			// Database download

			// msg.RunType, msg.Version
			switch msg.RunType {
			case "deployment":
				errfs = distfilesystem.DistributedStorageDeploymentDownload(msg.EnvironmentID, directoryRun, msg.NodeID, msg.RunType, msg.Version)
			default:
				errfs = distfilesystem.DistributedStoragePipelineDownload(msg.EnvironmentID, directoryRun, msg.NodeID)
			}

		case "LocalFile":

			// Nothing to do, the files will use a shared volume
			codeDirectory = wrkerconfig.CodeDirectory
			directoryRun = codeDirectory + directoryRun

		default:
			// Database download

		}

		if errfs != nil {
			statusUpdate = "Fail"
			if TasksStatusWG != "cancel" {
				TasksStatus.Set(msg.RunID, "error")
				// TasksStatus[msg.TaskID] = "error"
			}

			uid := uuid.NewString()
			logmsg := modelmain.LogsWorkers{
				CreatedAt:     time.Now().UTC(),
				UID:           uid,
				EnvironmentID: msg.EnvironmentID,
				RunID:         msg.RunID,
				NodeID:        msg.NodeID,
				TaskID:        msg.TaskID,
				Category:      "task",
				Log:           wrkerconfig.Secrets.Replace(errfs.Error()),
				LogType:       "error",
			}

			sendmsg := modelmain.LogsSend{
				CreatedAt: logmsg.CreatedAt,
				UID:       uid,
				Log:       wrkerconfig.Secrets.Replace(errfs.Error()),
				LogType:   "error",
			}

			messageq.MsgSend("workerlogs."+msg.EnvironmentID+"."+msg.RunID+"."+msg.NodeID, sendmsg)
			database.DBConn.Create(&logmsg)

			break
		}

		// Detect if folder is being requested
		if strings.Contains(v, "${{nodedirectory}}") {

			// directoryRun := wrkerconfig.CodeDirectory + msg.Folder + "/"
			// log.Println("==== Directory:", directoryRun)

			// construct the directory if the directory cant be found
			// var newdir string
			if _, err := os.Stat(directoryRun); os.IsNotExist(err) {

				if wrkerconfig.Debug == "true" {
					log.Println("Directory not found:", directoryRun)
				}

				WSLogError("Directory not found:"+directoryRun, msg, TaskUpdate)
				return
			}

			// Overwrite command with injected directory
			v = strings.ReplaceAll(v, "${{nodedirectory}}", directoryRun+"/")

		}

		// log.Println("command:", v)
		var cmd *exec.Cmd
		switch wrkerconfig.DPworkerCMD {
		case "/bin/bash":
			cmd = exec.Command("/bin/bash", "-c", v)
		case "/bin/sh":
			cmd = exec.Command("/bin/sh", "-c", v)
		default:
			cmd = exec.Command(v)
		}

		cmd.Env = os.Environ()
		cmd.Env = append(cmd.Env, "DP_PIPELINEID="+msg.PipelineID)
		cmd.Env = append(cmd.Env, "DP_NODEID="+msg.NodeID)
		cmd.Env = append(cmd.Env, "DP_RUNID="+msg.RunID)
		cmd.Env = append(cmd.Env, "DP_TASKID="+msg.TaskID)
		cmd.Env = append(cmd.Env, "DP_ENVID="+msg.EnvironmentID)
		cmd.Env = append(cmd.Env, "DP_API_DATA="+redisData.Data)

		// Request the OS to assign process group to the new process, to which all its children will belong
		cmd.SysProcAttr = &syscall.SysProcAttr{Setpgid: true}

		// Get a pipe to read from standard out
		r, _ := cmd.StdoutPipe()

		// Use the same pipe for standard error
		// cmd.Stderr = cmd.Stdout
		// cmd.Stdout

		// Make a new channel which will be used to ensure we get all output
		done := make(chan struct{})

		// Create a scanner which scans r in a line-by-line fashion
		scanner := bufio.NewScanner(r)

		// Use the scanner to scan the output line by line and log it
		// It's running in a goroutine so that it doesn't block
		go func() {

			// Read line by line and process it
			for scanner.Scan() {
				uid := uuid.NewString()
				line := wrkerconfig.Secrets.Replace(scanner.Text())

				logmsg := modelmain.LogsWorkers{
					CreatedAt:     time.Now().UTC(),
					UID:           uid,
					EnvironmentID: msg.EnvironmentID,
					RunID:         msg.RunID,
					NodeID:        msg.NodeID,
					TaskID:        msg.TaskID,
					Category:      "task",
					Log:           line,
					LogType:       "info",
				}

				// jsonmsg, err := json.Marshal(&logmsg)
				// if err != nil {
				// 	logging.PrintSecretsRedact(err)
				// }
				sendmsg := modelmain.LogsSend{
					CreatedAt: logmsg.CreatedAt,
					UID:       uid,
					Log:       line,
					LogType:   "info",
				}

				mqworker.MsgSend("workerlogs."+msg.EnvironmentID+"."+msg.RunID+"."+msg.NodeID, sendmsg)
				database.DBConn.Create(&logmsg)
				if wrkerconfig.Debug == "true" {
					clog.Info(line)
				}
			}

			// We're all done, unblock the channel
			done <- struct{}{}

		}()

		// ------ Error logging -----------
		var stderr bytes.Buffer
		cmd.Stderr = &stderr

		// ----------- Start the command and check for errors -------

		if tmp, ok := Tasks.Get(msg.TaskID); ok {
			TasksRun = tmp.(Task)
		}

		var task Task

		task.ID = msg.TaskID
		task.Context = TasksRun.Context
		task.Cancel = TasksRun.Cancel
		// TasksStatus[msg.TaskID] = "run"
		TasksStatus.Set(msg.TaskID, "run")

		if wrkerconfig.Debug == "true" {
			// log.Println("tasks before pid:", Tasks)
		}
		err := cmd.Start()
		if err != nil {
			statusUpdate = "Fail"
			if TasksStatusWG != "cancel" {
				TasksStatus.Set(msg.TaskID, "error")
				// TasksStatus[msg.TaskID] = "error"
			}

			uid := uuid.NewString()
			line := wrkerconfig.Secrets.Replace(err.Error())

			logmsg := modelmain.LogsWorkers{
				CreatedAt:     time.Now().UTC(),
				UID:           uid,
				EnvironmentID: msg.EnvironmentID,
				RunID:         msg.RunID,
				NodeID:        msg.NodeID,
				TaskID:        msg.TaskID,
				Category:      "task",
				Log:           line,
				LogType:       "error",
			}

			// jsonmsg, err := json.Marshal(&logmsg)
			// if err != nil {
			// 	logging.PrintSecretsRedact(err)
			// }
			sendmsg := modelmain.LogsSend{
				CreatedAt: logmsg.CreatedAt,
				UID:       uid,
				Log:       line,
				LogType:   "error",
			}

			mqworker.MsgSend("workerlogs."+msg.EnvironmentID+"."+msg.RunID+"."+msg.NodeID, sendmsg)
			database.DBConn.Create(&logmsg)
			if wrkerconfig.Debug == "true" {
				clog.Error(line)
			}

			// Break the loop
			break
		}
		task.PID = cmd.Process.Pid
		Tasks.Set(msg.TaskID, task)
		// Tasks[msg.TaskID] = task

		if wrkerconfig.Debug == "true" {
			// fmt.Println("PID ", cmd.Process.Pid)
			// log.Println("tasks after pid:", Tasks)
			// log.Println(err)
		}

		// Wait for all output to be processed
		<-done

		// Wait for the command to finish
		err = cmd.Wait()

		if tmp, ok := TasksStatus.Get(msg.TaskID); ok {
			TasksStatusWG = tmp.(string)
		}

		if err != nil {

			uid := uuid.NewString()
			line := wrkerconfig.Secrets.Replace(err.Error())

			logmsg := modelmain.LogsWorkers{
				CreatedAt:     time.Now().UTC(),
				UID:           uid,
				EnvironmentID: msg.EnvironmentID,
				RunID:         msg.RunID,
				NodeID:        msg.NodeID,
				TaskID:        msg.TaskID,
				Category:      "task",
				Log:           line,
				LogType:       "error",
			}

			// jsonmsg, err := json.Marshal(&logmsg)
			// if err != nil {
			// 	logging.PrintSecretsRedact(err)
			// }
			sendmsg := modelmain.LogsSend{
				CreatedAt: logmsg.CreatedAt,
				UID:       uid,
				Log:       line,
				LogType:   "error",
			}

			mqworker.MsgSend("workerlogs."+msg.EnvironmentID+"."+msg.RunID+"."+msg.NodeID, sendmsg)
			database.DBConn.Create(&logmsg)
			if wrkerconfig.Debug == "true" {
				// clog.Error("cmd.wait error")
				clog.Error(line)
			}

			statusUpdate = "Fail"
			if TasksStatusWG != "cancel" {
				TasksStatus.Set(msg.TaskID, "error")
				// TasksStatus[msg.TaskID] = "error"
			}
			break
		} else {
			statusUpdate = "Success"
		}
		if wrkerconfig.Debug == "true" {
			// log.Println(i, err)
		}
	}

	if wrkerconfig.Debug == "true" {
		// log.Println("Update task as " + statusUpdate + " - " + msg.TaskID)
	}

	// if there are empty commands simply move on as success.
	// log.Println("Node status", msg.NodeID, statusUpdate)
	if statusUpdate == "Run" {
		statusUpdate = "Success"
	}

	if tmp, ok := TasksStatus.Get(msg.TaskID); ok {
		TasksStatusWG = tmp.(string)
	}

	TaskFinal := modelmain.WorkerTasks{
		TaskID:        msg.TaskID,
		CreatedAt:     TaskUpdate.CreatedAt,
		EnvironmentID: wrkerconfig.EnvID,
		RunID:         msg.RunID,
		WorkerGroup:   TaskUpdate.WorkerGroup,
		WorkerID:      wrkerconfig.WorkerID,
		NodeID:        msg.NodeID,
		PipelineID:    msg.PipelineID,
		StartDT:       TaskUpdate.StartDT,
		Status:        statusUpdate,
		Reason:        TasksStatusWG,
		EndDT:         time.Now().UTC(),
	}
	UpdateWorkerTasks(TaskFinal)

	if wrkerconfig.Debug == "true" {
		// log.Println("tasks delete:", msg.TaskID)
		// log.Println("tasks before del:", Tasks)
	}

	coderuntime := time.Now().UTC().Sub(TaskUpdate.CreatedAt)

	logmsg := modelmain.LogsWorkers{
		CreatedAt:     time.Now().UTC(),
		UID:           uuid.NewString(),
		EnvironmentID: msg.EnvironmentID,
		RunID:         msg.RunID,
		NodeID:        msg.NodeID,
		TaskID:        msg.TaskID,
		Category:      "task",
		Log:           fmt.Sprintf("Run time: %v", coderuntime),
		LogType:       "info",
	}

	sendmsg := modelmain.LogsSend{
		CreatedAt: time.Now().UTC(),
		UID:       uuid.NewString(),
		Log:       fmt.Sprintf("Run time: %v", coderuntime),
		LogType:   "info",
	}

	mqworker.MsgSend("workerlogs."+msg.EnvironmentID+"."+msg.RunID+"."+msg.NodeID, sendmsg)
	database.DBConn.Create(&logmsg)

	// Queue the next set of tasks
	RunNext := modelmain.WorkerPipelineNext{
		TaskID:        msg.TaskID,
		CreatedAt:     TaskUpdate.CreatedAt,
		EnvironmentID: wrkerconfig.EnvID,
		PipelineID:    msg.PipelineID,
		RunID:         msg.RunID,
		NodeID:        msg.NodeID,
		Status:        statusUpdate,
	}

	errnat := mqworker.MsgSend("pipeline-run-next", RunNext)
	if errnat != nil {
		WSLogError("Failed nats to send to next run runid: "+msg.RunID+" - node:"+msg.NodeID, msg, TaskUpdate)
		if wrkerconfig.Debug == "true" {
			log.Println(errnat)
		}

	}

	// delete(TasksStatus, msg.TaskID)
	// delete(Tasks, msg.TaskID)
	TasksStatus.Remove(msg.TaskID)
	Tasks.Remove(msg.TaskID)

	if wrkerconfig.Debug == "true" {
		// log.Println("tasks after del:", Tasks)
	}

	<-ctx.Done()
}
