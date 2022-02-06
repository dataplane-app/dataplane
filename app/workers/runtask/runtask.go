package runtask

import (
	"bufio"
	"context"
	"dataplane/workers/database"
	"dataplane/workers/database/models"
	"dataplane/workers/messageq"
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

	if os.Getenv("debug") == "true" {
		fmt.Printf("starting task with id %s\n", taskID)
	}

	for i, v := range command {
		// Print the log timestamps
		clog.PrintTimestamp = true

		if TasksStatus[taskID] == "cancel" {
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
		cmd.Stderr = cmd.Stdout
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

				clog.Info(line)
			}

			// We're all done, unblock the channel
			done <- struct{}{}

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

		// Wait for the command to finish
		err = cmd.Wait()
		if os.Getenv("debug") == "true" {
			log.Println(i, err)
		}
	}
	<-ctx.Done()
	delete(TasksStatus, taskID)
}

// func Runtask() fiber.Handler {

// 	return func(c *fiber.Ctx) error {

// 		var reqbody Runner
// 		// TaskID := uuid.NewString()
// 		TaskID := "f240c0bc-1593-46d5-9a5b-37cc452fb0b0"
// 		ctx, cancel := context.WithCancel(context.Background())
// 		var task Task

// 		task.ID = TaskID
// 		task.Context = ctx
// 		task.Cancel = cancel

// 		Tasks[task.ID] = task
// 		command := []string{`for((i=1;i<=10000; i+=1)); do echo "Welcome $i times"; sleep 1; done`}
// 		// command := `find . | sed -e "s/[^ ][^\/]*\// |/g" -e "s/|\([^ ]\)/| \1/"`
// 		go worker(ctx, "", TaskID, command)

// 		body := c.Body()
// 		json.Unmarshal(body, &reqbody)

// 		return c.SendString("🏃 Task run start")

// 	}

// }
