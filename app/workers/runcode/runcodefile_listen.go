package runcodeworker

import (
	"context"
	"log"
	"syscall"
	"time"

	modelmain "github.com/dataplane-app/dataplane/mainapp/database/models"

	wrkerconfig "github.com/dataplane-app/dataplane/workers/config"
	"github.com/dataplane-app/dataplane/workers/messageq"
)

type TaskResponse struct {
	R string
	M string
}

func ListenRunCode() {

	// Responding to a task request
	channel := "runcodefile." + wrkerconfig.WorkerGroup + "." + wrkerconfig.WorkerID
	// log.Println("channel:", channel)
	messageq.NATSencoded.Subscribe(channel, func(subj, reply string, msg modelmain.CodeRun) {
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

			msg.Status = "Fail"
			msg.Reason = message
			msg.EndedAt = time.Now().UTC()

			UpdateRunCodeFile(msg)
		}

		x := TaskResponse{R: response, M: message}
		messageq.NATSencoded.Publish(reply, x)

		if x.R == "ok" {
			TaskID := msg.RunID
			ctx, cancel := context.WithCancel(context.Background())
			var task Task

			task.ID = TaskID
			task.Context = ctx
			task.Cancel = cancel

			// Tasks[task.ID] = task
			Tasks.Set(task.ID, task)
			// command := `for((i=1;i<=10000; i+=1)); do echo "Welcome $i times"; sleep 1; done`
			// command := `find . | sed -e "s/[^ ][^\/]*\// |/g" -e "s/|\([^ ]\)/| \1/"`
			go coderunworker(ctx, msg)
		}
	})
	if wrkerconfig.Debug == "true" {
		log.Println("🎧 Listening for code runs on subject:", channel)
	}

	messageq.NATSencoded.Subscribe("runcodefilecancel."+wrkerconfig.WorkerGroup+"."+wrkerconfig.WorkerID, func(subj, reply string, msg modelmain.CodeRun) {
		// Respond to cancelling a task
		id := msg.RunID

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
		x := TaskResponse{R: response, M: message}
		messageq.NATSencoded.Publish(reply, x)

	})

}
