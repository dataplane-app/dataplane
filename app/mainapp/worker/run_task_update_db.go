package worker

import (
	"dataplane/mainapp/database"
	"dataplane/mainapp/database/models"
	"dataplane/mainapp/logging"

	"gorm.io/gorm/clause"
)

func UpdateWorkerTasks(msg models.WorkerTasks) {

	/* The go routine causes the update to happen after sent to run next
	Better to run in sequence for proper status update before running next part of the graph
	*/
	// go func() {

	err2 := database.DBConn.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "task_id"}},
		DoUpdates: clause.AssignmentColumns([]string{"end_dt", "status", "reason", "worker_id"}),
	}).Create(&msg)
	if err2.Error != nil {
		logging.PrintSecretsRedact(err2.Error.Error())
	}

	// }()

}
