package runtask

import (
	"context"
	"dataplane/mainapp/database/models"
	"dataplane/workers/messageq"
	"dataplane/workers/workerhealth"
	"log"
	"os"
)

type TaskResponse struct {
	R string
	M string
}

func ListenTasks() {

	// Responding to a request message
	messageq.NATSencoded.Subscribe("task."+os.Getenv("worker_group")+"."+workerhealth.WorkerID, func(subj, reply string, msg models.WorkerTaskSend) {
		log.Println(msg)

		response := "ok"
		message := "ok"
		if os.Getenv("worker_env") != msg.EnvironmentID {
			response = "failed"
			message = "Incorrect environment"
		}

		x := TaskResponse{R: response, M: message}
		messageq.NATSencoded.Publish(reply, x)

		if x.R == "ok" {
			TaskID := msg.TaskID
			ctx, cancel := context.WithCancel(context.Background())
			var task Task

			task.ID = TaskID
			task.Context = ctx
			task.Cancel = cancel

			Tasks[task.ID] = task
			// command := `for((i=1;i<=10000; i+=1)); do echo "Welcome $i times"; sleep 1; done`
			// command := `find . | sed -e "s/[^ ][^\/]*\// |/g" -e "s/|\([^ ]\)/| \1/"`
			go worker(ctx, msg.RunID, TaskID, msg.Commands)
		}
	})

}
