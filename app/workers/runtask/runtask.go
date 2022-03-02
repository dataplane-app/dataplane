package runtask

import (
	"bufio"
	"context"
	modelmain "dataplane/mainapp/database/models"
	"dataplane/workers/config"
	"dataplane/workers/database"
	"dataplane/workers/logging"
	"dataplane/workers/messageq"
	"fmt"
	"os"
	"os/exec"
	"syscall"
	"time"

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

var Tasks = make(map[string]Task)

var TasksStatus = make(map[string]string)

// Worker function to run task
func worker(ctx context.Context, msg modelmain.WorkerTaskSend) {

	var statusUpdate string

	if os.Getenv("debug") == "true" {
		fmt.Printf("starting task with id %s - node: %s run: %s\n", msg.TaskID, msg.NodeID, msg.RunID)
	}

	// --- Check if this task is already running
	var lockCheck modelmain.WorkerTasks
	err2 := database.DBConn.Select("task_id", "status").Where("task_id = ?", msg.TaskID).First(&lockCheck).Error
	if err2 != nil {
		logging.PrintSecretsRedact(err2.Error())
		return
	}

	if lockCheck.Status != "Queue" {
		logging.PrintSecretsRedact("Skipping not in queue", msg.RunID, msg.NodeID)
		return
	}

	statusUpdate = "Run"

	TaskUpdate := modelmain.WorkerTasks{
		TaskID:        msg.TaskID,
		CreatedAt:     time.Now().UTC(),
		EnvironmentID: msg.EnvironmentID,
		RunID:         msg.RunID,
		NodeID:        msg.NodeID,
		PipelineID:    msg.PipelineID,
		WorkerGroup:   os.Getenv("worker_group"),
		WorkerID:      config.WorkerID,
		StartDT:       time.Now().UTC(),
		Status:        statusUpdate,
	}

	UpdateWorkerTasks(TaskUpdate)
	// var response TaskResponse
	// _, errnats := messageq.MsgReply("taskupdate", TaskUpdate, &response)

	// if errnats != nil {
	// 	logging.PrintSecretsRedact("Update task error nats:", errnats)
	// }

	for _, v := range msg.Commands {
		// Print the log timestamps
		clog.PrintTimestamp = true

		if TasksStatus[msg.TaskID] == "cancel" {
			delete(TasksStatus, msg.TaskID)
			break
		}

		if TasksStatus[msg.TaskID] == "error" {
			delete(TasksStatus, msg.TaskID)
			break
		}

		// log.Println("command:", v)

		cmd := exec.Command("/bin/bash", "-c", v)

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
				line := config.Secrets.Replace(scanner.Text())

				logmsg := modelmain.LogsWorkers{
					CreatedAt:     time.Now().UTC(),
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
				messageq.MsgSend("workertask."+msg.TaskID, logmsg)
				database.DBConn.Create(&logmsg)
				if os.Getenv("debug") == "true" {
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
				line := config.Secrets.Replace(scannerErr.Text())

				logmsg := modelmain.LogsWorkers{
					CreatedAt:     time.Now().UTC(),
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
				messageq.MsgSend("workertask."+msg.TaskID, logmsg)
				database.DBConn.Create(&logmsg)
				if os.Getenv("debug") == "true" {
					clog.Error(line)
				}
			}

			// We're all done, unblock the channel
			doneErr <- struct{}{}

		}()

		// Start the command and check for errors
		var task Task

		task.ID = msg.TaskID
		task.Context = Tasks[msg.TaskID].Context
		task.Cancel = Tasks[msg.TaskID].Cancel
		TasksStatus[msg.TaskID] = "run"

		if os.Getenv("debug") == "true" {
			// log.Println("tasks before pid:", Tasks)
		}
		err := cmd.Start()
		task.PID = cmd.Process.Pid
		Tasks[msg.TaskID] = task

		if os.Getenv("debug") == "true" {
			// fmt.Println("PID ", cmd.Process.Pid)
			// log.Println("tasks after pid:", Tasks)
			// log.Println(err)
		}

		// Wait for all output to be processed
		<-done
		<-doneErr

		// Wait for the command to finish
		err = cmd.Wait()

		if err != nil {
			statusUpdate = "Fail"
			if TasksStatus[msg.TaskID] != "cancel" {
				TasksStatus[msg.TaskID] = "error"
			}
			break
		} else {
			statusUpdate = "Success"
		}
		if os.Getenv("debug") == "true" {
			// log.Println(i, err)
		}
	}

	if os.Getenv("debug") == "true" {
		// log.Println("Update task as " + statusUpdate + " - " + msg.TaskID)
	}

	// if there are empty commands simply move on as success.
	if statusUpdate == "Run" {
		statusUpdate = "Success"
	}

	TaskFinal := modelmain.WorkerTasks{
		TaskID:        msg.TaskID,
		CreatedAt:     TaskUpdate.CreatedAt,
		EnvironmentID: config.EnvID,
		RunID:         msg.RunID,
		WorkerGroup:   TaskUpdate.WorkerGroup,
		WorkerID:      config.WorkerID,
		NodeID:        msg.NodeID,
		PipelineID:    msg.PipelineID,
		StartDT:       TaskUpdate.StartDT,
		Status:        statusUpdate,
		Reason:        TasksStatus[msg.TaskID],
		EndDT:         time.Now().UTC(),
	}
	UpdateWorkerTasks(TaskFinal)

	// _, errnats = messageq.MsgReply("taskupdate", TaskFinal, &response)

	if config.Debug == "true" {
		// log.Println("tasks delete:", msg.TaskID)
		// log.Println("tasks before del:", Tasks)
	}

	// Queue the next set of tasks
	RunNext := modelmain.WorkerPipelineNext{
		TaskID:        msg.TaskID,
		CreatedAt:     TaskUpdate.CreatedAt,
		EnvironmentID: config.EnvID,
		PipelineID:    msg.PipelineID,
		RunID:         msg.RunID,
		NodeID:        msg.NodeID,
		Status:        statusUpdate,
	}

	errnat := messageq.MsgSend("pipeline-run-next", RunNext)
	if errnat != nil {
		if config.Debug == "true" {
			logging.PrintSecretsRedact(errnat)
		}

	}

	delete(TasksStatus, msg.TaskID)
	delete(Tasks, msg.TaskID)

	if config.Debug == "true" {
		// log.Println("tasks after del:", Tasks)
	}

	<-ctx.Done()
}
