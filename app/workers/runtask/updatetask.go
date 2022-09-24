package runtask

import (
	"log"
	"time"

	"github.com/dataplane-app/dataplane/mainapp/database/models"
	modelmain "github.com/dataplane-app/dataplane/mainapp/database/models"

	wrkerconfig "github.com/dataplane-app/dataplane/workers/config"
	"github.com/dataplane-app/dataplane/workers/database"
	"github.com/dataplane-app/dataplane/workers/messageq"

	"gorm.io/gorm/clause"
)

func UpdateWorkerTasks(msg modelmain.WorkerTasks) {

	/* The go routine causes the update to happen after sent to run next
	Better to run in sequence for proper status update before running next part of the graph
	*/
	// go func() {

	err2 := database.DBConn.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "task_id"}},
		DoUpdates: clause.AssignmentColumns([]string{"start_dt", "end_dt", "status", "reason", "worker_id", "worker_group"}),
	}).Create(&msg)
	if err2.Error != nil {
		log.Println(err2.Error.Error())
	}

	if msg.Status == "Fail" {

		// Update pipeline as failed
		run := models.PipelineRuns{
			RunID:   msg.RunID,
			Status:  "Fail",
			EndedAt: time.Now().UTC(),
		}

		err2 := database.DBConn.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "run_id"}},
			DoUpdates: clause.AssignmentColumns([]string{"ended_at", "status"}),
		}).Create(&run)
		if err2.Error != nil {
			log.Println(err2.Error.Error())
		}

		// Update all the future tasks
		err3 := database.DBConn.Model(&modelmain.WorkerTasks{}).Where("run_id = ? and status=?", msg.RunID, "Queue").Updates(map[string]interface{}{"status": "Fail", "reason": "Upstream fail"}).Error
		if err3 != nil {
			log.Println(err3.Error())
		}

	}

	errnat := messageq.MsgSend("taskupdate."+msg.EnvironmentID+"."+msg.RunID, msg)
	if errnat != nil {
		if wrkerconfig.Debug == "true" {
			log.Println(errnat)
		}

	}

	// }()

}
