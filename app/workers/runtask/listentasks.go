package runtask

import (
	"dataplane/mainapp/database/models"
	"dataplane/workers/messageq"
	"dataplane/workers/workerhealth"
	"log"
	"os"
)

type TaskResponse struct {
	R string
}

func ListenTasks() {

	// Responding to a request message
	messageq.NATSencoded.Subscribe("task."+os.Getenv("worker_group")+"."+workerhealth.WorkerID, func(subj, reply string, msg models.WorkerTaskSend) {
		log.Println(msg)

		x := TaskResponse{R: "ok"}
		messageq.NATSencoded.Publish(reply, x)
	})

}
