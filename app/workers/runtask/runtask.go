package runtask

import (
	"bufio"
	"context"
	modelmain "dataplane/mainapp/database/models"
	"dataplane/workers/config"
	"dataplane/workers/database"
	"dataplane/workers/database/models"
	"dataplane/workers/logging"
	"dataplane/workers/messageq"
	"dataplane/workers/workerhealth"
	"fmt"
	"log"
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
func worker(ctx context.Context, runID string, taskID string, command []string) {

	var statusUpdate string

	if os.Getenv("debug") == "true" {
		fmt.Printf("starting task with id %s\n", taskID)
	}

	statusUpdate = "Run"

	TaskUpdate := modelmain.WorkerTasks{
		TaskID:        taskID,
		CreatedAt:     time.Now().UTC(),
		EnvironmentID: config.EnvID,
		RunID:         runID,
		WorkerGroup:   os.Getenv("worker_group"),
		WorkerID:      workerhealth.WorkerID,
		StartDT:       time.Now().UTC(),
		Status:        statusUpdate,
	}
	var response TaskResponse
	_, errnats := messageq.MsgReply("taskupdate", TaskUpdate, &response)

	if errnats != nil {
		logging.PrintSecretsRedact("Update task error nats:", errnats)
	}

	for i, v := range command {
		// Print the log timestamps
		clog.PrintTimestamp = true

		if TasksStatus[taskID] == "cancel" {
			delete(TasksStatus, taskID)
			break
		}

		if TasksStatus[taskID] == "error" {
			delete(TasksStatus, taskID)
			break
		}

		// log.Println("command:", i, v)

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
				line := scanner.Text()

				logmsg := models.LogsWorkers{
					CreatedAt:     time.Now().UTC(),
					EnvironmentID: os.Getenv("worker_env"),
					RunID:         runID,
					TaskID:        taskID,
					Category:      "task",
					Log:           line,
					LogType:       "info",
				}

				// jsonmsg, err := json.Marshal(&logmsg)
				// if err != nil {
				// 	logging.PrintSecretsRedact(err)
				// }
				messageq.MsgSend("workertask."+taskID, logmsg)
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
				line := scannerErr.Text()

				logmsg := models.LogsWorkers{
					CreatedAt:     time.Now().UTC(),
					EnvironmentID: os.Getenv("worker_env"),
					RunID:         runID,
					TaskID:        taskID,
					Category:      "task",
					Log:           line,
					LogType:       "error",
				}

				// jsonmsg, err := json.Marshal(&logmsg)
				// if err != nil {
				// 	logging.PrintSecretsRedact(err)
				// }
				messageq.MsgSend("workertask."+taskID, logmsg)
				database.DBConn.Create(&logmsg)

				clog.Error(line)
			}

			// We're all done, unblock the channel
			doneErr <- struct{}{}

		}()

		// Start the command and check for errors
		var task Task

		task.ID = taskID
		task.Context = Tasks[taskID].Context
		task.Cancel = Tasks[taskID].Cancel
		TasksStatus[taskID] = "run"

		if os.Getenv("debug") == "true" {
			log.Println("tasks before pid:", Tasks)
		}
		err := cmd.Start()
		task.PID = cmd.Process.Pid
		Tasks[taskID] = task

		if os.Getenv("debug") == "true" {
			fmt.Println("PID ", cmd.Process.Pid)
			log.Println("tasks after pid:", Tasks)
			log.Println(err)
		}

		// Wait for all output to be processed
		<-done
		<-doneErr

		// Wait for the command to finish
		err = cmd.Wait()

		if err != nil {
			statusUpdate = "Fail"
			if TasksStatus[taskID] != "cancel" {
				TasksStatus[taskID] = "error"
			}
			break
		} else {
			statusUpdate = "Success"
		}
		if os.Getenv("debug") == "true" {
			log.Println(i, err)
		}
	}

	if os.Getenv("debug") == "true" {
		log.Println("Update task as " + statusUpdate + " - " + taskID)
	}
	TaskFinal := modelmain.WorkerTasks{
		TaskID:        taskID,
		CreatedAt:     TaskUpdate.CreatedAt,
		EnvironmentID: config.EnvID,
		RunID:         runID,
		WorkerGroup:   TaskUpdate.WorkerGroup,
		WorkerID:      workerhealth.WorkerID,
		StartDT:       TaskUpdate.StartDT,
		Status:        statusUpdate,
		Reason:        TasksStatus[taskID],
		EndDT:         time.Now().UTC(),
	}

	_, errnats = messageq.MsgReply("taskupdate", TaskFinal, &response)

	if os.Getenv("debug") == "true" {
		log.Println("tasks delete:", taskID)
		log.Println("tasks before del:", Tasks)
	}

	delete(TasksStatus, taskID)
	delete(Tasks, taskID)

	if os.Getenv("debug") == "true" {
		log.Println("tasks after del:", Tasks)
	}

	<-ctx.Done()
}
