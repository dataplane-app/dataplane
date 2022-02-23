package runtask

import (
	modelmain "dataplane/mainapp/database/models"
	"dataplane/workers/database"
	"dataplane/workers/logging"

	"gorm.io/gorm/clause"
)

func UpdateWorkerTasks(msg modelmain.WorkerTasks) {

	go func() {

		err2 := database.DBConn.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "task_id"}},
			DoUpdates: clause.AssignmentColumns([]string{"start_dt", "end_dt", "status", "reason", "worker_id", "worker_group"}),
		}).Create(&msg)
		if err2.Error != nil {
			logging.PrintSecretsRedact(err2.Error.Error())
		}

	}()

}
