package worker

import (
	"dataplane/mainapp/database"
	"dataplane/mainapp/database/models"
	"dataplane/mainapp/logging"
	"dataplane/mainapp/messageq"
	"dataplane/workers/runtask"
	"encoding/json"
	"log"

	"gorm.io/gorm/clause"
)

func UpdateTasks(MainAppID string) {

	messageq.NATSencoded.Subscribe("taskupdate", func(subj, reply string, msg models.WorkerTasks) {

		log.Println("update task:", msg.WorkerID, msg.EnvironmentID)

		// Update database
		go func() {

			err2 := database.DBConn.Clauses(clause.OnConflict{
				Columns:   []clause.Column{{Name: "task_id"}},
				DoUpdates: clause.AssignmentColumns([]string{"end_dt", "status", "reason"}),
			}).Create(&msg)
			if err2.Error != nil {
				logging.PrintSecretsRedact(err2.Error.Error())
			}

		}()

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
