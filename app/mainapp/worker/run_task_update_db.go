package worker

import (
	"dataplane/mainapp/database"
	"dataplane/mainapp/database/models"
	"dataplane/mainapp/logging"

	"gorm.io/gorm/clause"
)

func UpdateWorkerTasks(msg models.WorkerTasks) {

	go func() {

		err2 := database.DBConn.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "task_id"}},
			DoUpdates: clause.AssignmentColumns([]string{"end_dt", "status", "reason", "worker_id"}),
		}).Create(&msg)
		if err2.Error != nil {
			logging.PrintSecretsRedact(err2.Error.Error())
		}

	}()

}
