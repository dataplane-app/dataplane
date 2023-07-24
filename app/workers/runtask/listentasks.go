package runtask

import (
	"context"
	"log"
	"syscall"
	"time"

	modelmain "github.com/dataplane-app/dataplane/app/mainapp/database/models"

	wrkerconfig "github.com/dataplane-app/dataplane/app/workers/config"
	"github.com/dataplane-app/dataplane/app/workers/messageq"
)

func ListenTasks() {

	// Responding to a task request
	messageq.NATSencoded.Subscribe("task."+wrkerconfig.WorkerGroup+"."+wrkerconfig.WorkerID, func(subj, reply string, msg modelmain.WorkerTaskSend) {
		// log.Println("message:", msg)

		response := "ok"
		message := "ok"
		// msg.EnvironmentID
		if wrkerconfig.EnvID != msg.EnvironmentID {
			response = "failed"
			message = "Incorrect environment"
			if wrkerconfig.Debug == "true" {
				log.Println("response", response, message)
			}

			// log.Println("Run ID:", msg.RunID)

			TaskFinal := modelmain.WorkerTasks{
				TaskID:        msg.TaskID,
				EnvironmentID: wrkerconfig.EnvID,
				RunID:         msg.RunID,
				WorkerID:      wrkerconfig.WorkerID,
				NodeID:        msg.NodeID,
				PipelineID:    msg.PipelineID,
				Status:        "Fail",
				Reason:        message,
				EndDT:         time.Now().UTC(),
			}
			UpdateWorkerTasks(TaskFinal)
		}

		x := modelmain.TaskResponse{R: response, M: message}
		messageq.NATSencoded.Publish(reply, x)

		if x.R == "ok" {
			TaskID := msg.TaskID
			ctx, cancel := context.WithCancel(context.Background())
			var task Task

			task.ID = TaskID
			task.Context = ctx
			task.Cancel = cancel

			// Tasks[task.ID] = task
			Tasks.Set(task.ID, task)
			// command := `for((i=1;i<=10000; i+=1)); do echo "Welcome $i times"; sleep 1; done`
			// command := `find . | sed -e "s/[^ ][^\/]*\// |/g" -e "s/|\([^ ]\)/| \1/"`
			go worker(ctx, msg)
		}
	})
	if wrkerconfig.Debug == "true" {
		log.Println("🎧 Listening for tasks on subject:", "task."+wrkerconfig.WorkerGroup+"."+wrkerconfig.WorkerID)
	}

	messageq.NATSencoded.Subscribe("taskcancel."+wrkerconfig.WorkerGroup+"."+wrkerconfig.WorkerID, func(subj, reply string, msg modelmain.WorkerTaskSend) {
		// Respond to cancelling a task
		id := msg.TaskID

		var TasksRun Task

		if tmp, ok := Tasks.Get(id); ok {
			TasksRun = tmp.(Task)
		}

		if TasksRun.PID != 0 {
			_ = syscall.Kill(-TasksRun.PID, syscall.SIGKILL)
		}
		TasksRun.Cancel()
		// TasksStatus[id] = "cancel"
		TasksStatus.Set(id, "cancel")

		response := "ok"
		message := "ok"
		x := modelmain.TaskResponse{R: response, M: message}
		messageq.NATSencoded.Publish(reply, x)

	})

}
