package worker

import (
	"dataplane/mainapp/database/models"
	"dataplane/mainapp/messageq"
	"dataplane/workers/runtask"
	"encoding/json"
	"log"
)

func UpdateTasks(MainAppID string) {

	messageq.NATSencoded.Subscribe("taskupdate", func(subj, reply string, msg models.WorkerTasks) {

		log.Println("update task:", msg.WorkerID, msg.EnvironmentID)

		// Update database --- moved to worker node for better resilience

		jsonmsg, _ := json.Marshal(&msg)

		broadcastq <- message{data: jsonmsg, room: "taskupdate"}

		// Trigger stats updates:
		// Each Pipeline queue, run, success or fail
		// Pipeline tasks - run, success or fail
		// Workers - queue, run, success or fail

		x := runtask.TaskResponse{R: "ok", M: "ok"}
		messageq.NATSencoded.Publish(reply, x)

	})

}
