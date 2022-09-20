package runcodeworker

import (
	"bufio"
	"context"
	"dataplane/mainapp/code_editor/filesystem"
	modelmain "dataplane/mainapp/database/models"
	wrkerconfig "dataplane/workers/config"
	"dataplane/workers/database"
	"dataplane/workers/messageq"
	"encoding/json"
	"log"
	"os"
	"os/exec"
	"strings"
	"syscall"
	"time"

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

		return
	}

	// --- Check if this task is already running
	var lockCheck modelmain.CodeRun
	err2 := database.DBConn.Select("run_id", "status").Where("run_id = ?", msg.RunID).First(&lockCheck).Error
	if err2 != nil {
		log.Println(err2.Error())
		return
	}

	if lockCheck.Status != "Queue" {
		log.Println("Skipping not in queue", msg.RunID, msg.NodeID)
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

		codeDirectory := wrkerconfig.CodeDirectory
		directoryRun := codeDirectory + msg.Folder

		switch wrkerconfig.FSCodeFileStorage {
		case "Database":
			// Database download
			codeDirectory = wrkerconfig.FSCodeDirectory
			directoryRun = codeDirectory + msg.Folder
			err := DistributedStorageDownload(msg.EnvironmentID, msg.Folder, msg.FolderID, msg.NodeID)
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
			directoryRun = codeDirectory + msg.Folder

		default:
			// Database download
			codeDirectory = wrkerconfig.FSCodeDirectory
			directoryRun = codeDirectory + msg.Folder

		}

		/*
			msg.Folder = is the folder where the files are located. This is constructed in main app before request comes through.
			Code directory
		*/
		// log.Println(directoryRun)

		// Detect if folder is being requested
		if strings.Contains(v.Command, "${{nodedirectory}}") {

			// construct the directory if the directory cant be found
			if _, err := os.Stat(directoryRun); os.IsNotExist(err) {
				if wrkerconfig.Debug == "true" {
					log.Println("Directory not found - reconstructing:", directoryRun)
				}
				newdir, err := filesystem.FolderConstructByID(database.DBConn, msg.FolderID, msg.EnvironmentID, "pipelines")
				if err == nil {
					directoryRun = codeDirectory + newdir
				}
			}

			// Overwrite command with injected directory
			v.Command = strings.ReplaceAll(v.Command, "${{nodedirectory}}", directoryRun)

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

		cmd.Env = os.Environ()
		cmd.Env = append(cmd.Env, "DP_NODEID="+msg.NodeID)
		cmd.Env = append(cmd.Env, "DP_RUNID="+msg.RunID)

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

				messageq.MsgSend("coderunfilelogs."+msg.RunID, sendmsg)
				database.DBConn.Create(&logmsg)
				if wrkerconfig.Debug == "true" {
					clog.Info(line)
				}
			}

			// We're all done, unblock the channel
			done <- struct{}{}

		}()

		// ------ Error logging -----------
		rErr, _ := cmd.StderrPipe()

		// Make a new channel which will be used to ensure we get all output
		doneErr := make(chan struct{})

		// Create a scanner which scans r in a line-by-line fashion
		scannerErr := bufio.NewScanner(rErr)

		// Use the scanner to scan the output line by line and log it
		// It's running in a goroutine so that it doesn't block
		go func() {

			// Read line by line and process it
			for scannerErr.Scan() {
				uid := uuid.NewString()
				line := wrkerconfig.Secrets.Replace(scannerErr.Text())

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

				messageq.MsgSend("coderunfilelogs."+msg.RunID, sendmsg)
				database.DBConn.Create(&logmsg)
				if wrkerconfig.Debug == "true" {
					clog.Error(line)
				}
			}

			// We're all done, unblock the channel
			doneErr <- struct{}{}

		}()

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
			line := wrkerconfig.Secrets.Replace(err.Error())

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

			messageq.MsgSend("coderunfilelogs."+msg.RunID, sendmsg)
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
		<-doneErr

		// Wait for the command to finish
		err = cmd.Wait()

		if tmp, ok := TasksStatus.Get(msg.RunID); ok {
			TasksStatusWG = tmp.(string)
		}

		if err != nil {
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
