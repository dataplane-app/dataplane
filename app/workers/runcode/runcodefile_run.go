package runcodeworker

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"log"
	"os"
	"os/exec"
	"strings"
	"syscall"
	"time"

	"github.com/dataplane-app/dataplane/app/mainapp/code_editor/filesystem"
	modelmain "github.com/dataplane-app/dataplane/app/mainapp/database/models"

	"github.com/dataplane-app/dataplane/app/mainapp/database"
	"github.com/dataplane-app/dataplane/app/mainapp/messageq"
	wrkerconfig "github.com/dataplane-app/dataplane/app/workers/config"
	"github.com/dataplane-app/dataplane/app/workers/distfilesystem"

	"github.com/google/uuid"
	cmap "github.com/orcaman/concurrent-map"
	clog "github.com/pieterclaerhout/go-log"
)

type Runner struct {
	Command string `json:command`
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
func coderunworker(ctx context.Context, msg modelmain.CodeRun) {

	var statusUpdate string
	var TasksStatusWG string
	var TasksRun Task
	var CommandsList []Runner

	if wrkerconfig.Debug == "true" {
		log.Printf("starting code run with run: %s\n", msg.RunID)
	}

	// lock node for run
	var createLock = modelmain.CodeRunLock{
		RunID:  msg.RunID,
		FileID: msg.FileID,
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

		WSLogError("Error: lock for run and node exists: "+msg.RunID+" "+msg.NodeID, msg)

		return
	}

	// --- Check if this task is already running
	var lockCheck modelmain.CodeRun
	err2 := database.DBConn.Select("run_id", "status").Where("run_id = ?", msg.RunID).First(&lockCheck).Error
	if err2 != nil {
		log.Println(err2.Error())
		WSLogError("Error: already running: "+err2.Error(), msg)
		return
	}

	if lockCheck.Status != "Queue" {
		log.Println("Skipping not in queue", msg.RunID, msg.NodeID)
		WSLogError("Skipping not in queue: "+msg.RunID, msg)
		return
	}

	statusUpdate = "Run"

	updatetime := time.Now().UTC()
	TaskUpdate := modelmain.CodeRun{
		UpdatedAt:     &updatetime,
		EnvironmentID: msg.EnvironmentID,
		RunID:         msg.RunID,
		NodeID:        msg.NodeID,
		Status:        statusUpdate,
	}

	UpdateRunCodeFile(TaskUpdate)

	// ----- get data inputs -------
	ctxRedis := context.Background()
	redisData := modelmain.RedisAPIData{}
	if err := database.RedisConn.HGetAll(ctxRedis, "api-trigger-"+wrkerconfig.EnvID+"-"+msg.ReplayRunID).Scan(&redisData); err != nil {
		log.Println("Redis get leader error:", err)
	}

	json.Unmarshal(msg.Commands, &CommandsList)

	for _, v := range CommandsList {
		// Print the log timestamps
		clog.PrintTimestamp = true

		if tmp, ok := TasksStatus.Get(msg.RunID); ok {
			TasksStatusWG = tmp.(string)
		}

		if TasksStatusWG == "cancel" {
			// delete(TasksStatus, msg.TaskID)
			TasksStatus.Remove(msg.RunID)
			break
		}

		if TasksStatusWG == "error" {
			TasksStatus.Remove(msg.RunID)
			break
		}

		if wrkerconfig.Debug == "true" {
			log.Println("Code run file storage:", wrkerconfig.FSCodeFileStorage)
		}

		codeDirectory := wrkerconfig.FSCodeDirectory

		// Needs to use pipeline folder for caching between a pipeline run and a code editor run
		// log.Println("dir components: ", codeDirectory, "-", msg.EnvironmentID, "coderun", "-", msg.PipelineID, "-", msg.NodeID)
		directoryRun := filesystem.CodeRunFolderNode(codeDirectory, msg.EnvironmentID, msg.PipelineID, msg.NodeID)

		switch wrkerconfig.FSCodeFileStorage {
		case "Database":
			// Database download
			err := distfilesystem.DistributedStorageCodeRunDownload(msg.EnvironmentID, directoryRun, msg.NodeID)
			if err != nil {
				statusUpdate = "Fail"
				if TasksStatusWG != "cancel" {
					TasksStatus.Set(msg.RunID, "error")
					// TasksStatus[msg.TaskID] = "error"
				}
			}
		case "LocalFile":

			// Nothing to do, the files will use a shared volume
			codeDirectory = wrkerconfig.CodeDirectory
			directoryRun = codeDirectory + directoryRun

		default:

		}

		/*
			msg.Folder = is the folder where the files are located. This is constructed in main app before request comes through.
			Code directory
		*/
		// log.Println(directoryRun)

		// Detect if folder is being requested

		errmsg := ""
		if strings.Contains(v.Command, "${{nodedirectory}}") {

			// construct the directory if the directory cant be found
			if _, err := os.Stat(directoryRun); os.IsNotExist(err) {

				log.Println("Directory not found:", directoryRun)

				// Self healing: Write to file level cache (file gets overwritten)
				deleteQuery := `
					DELETE FROM code_run_files_cache
					USING pipeline_nodes
					WHERE code_run_files_cache.environment_id = ? and pipeline_nodes.pipeline_id =? and 
					pipeline_nodes.node_id = code_run_files_cache.node_id and pipeline_nodes.environment_id = code_run_files_cache.environment_id;
					`
				errdbrem := database.DBConn.Exec(deleteQuery, msg.EnvironmentID, msg.PipelineID).Error

				if errdbrem != nil {
					errmsg = "Directory not found:" + directoryRun + " - directory cache failed to clear, speak to Dataplanbe admin to clear the cache. DB error: " + errdbrem.Error()
					WSLogError(errmsg, msg)
					return
				}

				errmsg = "Directory not found:" + directoryRun + " - directory cache cleared, try running code again."
				WSLogError(errmsg, msg)

				return
			}

			// Overwrite command with injected directory
			v.Command = strings.ReplaceAll(v.Command, "${{nodedirectory}}", directoryRun+"/")

			if wrkerconfig.Debug == "true" {
				log.Println("Run command: ", v.Command)
			}

		}

		// log.Println("command:", v)
		// log.Println("shell used:", wrkerconfig.DPworkerCMD)

		var cmd *exec.Cmd
		switch wrkerconfig.DPworkerCMD {
		case "/bin/bash":
			cmd = exec.Command("/bin/bash", "-c", v.Command)
		case "/bin/sh":
			cmd = exec.Command("/bin/sh", "-c", v.Command)
		default:
			cmd = exec.Command(v.Command)
		}

		log.Println("RUN ID:", msg.ReplayRunID, msg.RunID, msg)
		if msg.ReplayRunID == "" {
			msg.ReplayRunID = msg.RunID
		}

		cmd.Env = os.Environ()
		cmd.Env = append(cmd.Env, "DP_NODEID="+msg.NodeID)
		cmd.Env = append(cmd.Env, "DP_RUNID="+msg.ReplayRunID)
		cmd.Env = append(cmd.Env, "DP_CODE_RUNID="+msg.RunID)
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

				logmsg := modelmain.LogsCodeRun{
					CreatedAt:     time.Now().UTC(),
					UID:           uid,
					EnvironmentID: msg.EnvironmentID,
					RunID:         msg.RunID,
					NodeID:        msg.NodeID,
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

				messageq.MsgSend("coderunfilelogs."+msg.EnvironmentID+"."+msg.RunID, sendmsg)
				// log.Println("coderunfilelogs." + msg.RunID)
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

		// Start the command and check for errors

		if tmp, ok := Tasks.Get(msg.RunID); ok {
			TasksRun = tmp.(Task)
		}

		var task Task

		task.ID = msg.RunID
		task.Context = TasksRun.Context
		task.Cancel = TasksRun.Cancel
		// TasksStatus[msg.TaskID] = "run"
		TasksStatus.Set(msg.RunID, "run")

		if wrkerconfig.Debug == "true" {
			// log.Println("tasks before pid:", task)
		}
		err := cmd.Start()
		if err != nil {
			statusUpdate = "Fail"
			if TasksStatusWG != "cancel" {
				TasksStatus.Set(msg.RunID, "error")
				// TasksStatus[msg.TaskID] = "error"
			}

			uid := uuid.NewString()
			// err is the error of the command, stderr is the error from the Python script
			line := wrkerconfig.Secrets.Replace(err.Error() + ":\n" + stderr.String())

			logmsg := modelmain.LogsCodeRun{
				CreatedAt:     time.Now().UTC(),
				UID:           uid,
				EnvironmentID: msg.EnvironmentID,
				RunID:         msg.RunID,
				NodeID:        msg.NodeID,
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

			messageq.MsgSend("coderunfilelogs."+msg.EnvironmentID+"."+msg.RunID, sendmsg)
			database.DBConn.Create(&logmsg)
			if wrkerconfig.Debug == "true" {
				clog.Error(line)
			}

			// Break the loop
			break
		}
		task.PID = cmd.Process.Pid
		Tasks.Set(msg.RunID, task)
		// Tasks[msg.TaskID] = task

		if wrkerconfig.Debug == "true" {
			// fmt.Println("PID ", cmd.Process.Pid)
			// log.Println("tasks after pid:", Tasks)
			// log.Println(err)
		}

		// Wait for all output to be processed
		<-done

		// Wait for the command to finish - send error logs on exit
		err = cmd.Wait()

		if tmp, ok := TasksStatus.Get(msg.RunID); ok {
			TasksStatusWG = tmp.(string)
		}

		if err != nil {

			uid := uuid.NewString()

			// err is the error of the command, stderr is the error from the Python script
			line := wrkerconfig.Secrets.Replace(err.Error() + ": \n" + stderr.String())

			logmsg := modelmain.LogsCodeRun{
				CreatedAt:     time.Now().UTC(),
				UID:           uid,
				EnvironmentID: msg.EnvironmentID,
				RunID:         msg.RunID,
				NodeID:        msg.NodeID,
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

			messageq.MsgSend("coderunfilelogs."+msg.EnvironmentID+"."+msg.RunID, sendmsg)
			database.DBConn.Create(&logmsg)
			if wrkerconfig.Debug == "true" {
				clog.Error(line)
			}

			statusUpdate = "Fail"
			if TasksStatusWG != "cancel" {
				TasksStatus.Set(msg.RunID, "error")
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

	if tmp, ok := TasksStatus.Get(msg.RunID); ok {
		TasksStatusWG = tmp.(string)
	}

	msg.Status = statusUpdate
	msg.EndedAt = time.Now().UTC()
	msg.Reason = TasksStatusWG
	UpdateRunCodeFile(msg)

	TasksStatus.Remove(msg.RunID)
	Tasks.Remove(msg.RunID)

	if wrkerconfig.Debug == "true" {
		// log.Println("tasks after del:", Tasks)
	}

	<-ctx.Done()
}
