package runcodeworker

import (
	"dataplane/mainapp/database/models"
	modelmain "dataplane/mainapp/database/models"
	"dataplane/workers/config"
	"dataplane/workers/database"
	"dataplane/workers/messageq"
	"log"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm/clause"
)

func UpdateRunCodeFile(msg modelmain.CodeRun) {

	/* The go routine causes the update to happen after sent to run next
	Better to run in sequence for proper status update before running next part of the graph
	*/
	// go func() {

	err2 := database.DBConn.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "run_id"}},
		DoUpdates: clause.AssignmentColumns([]string{"ended_at", "status", "reason"}),
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

	// log.Println("msg: ", "taskupdate."+msg.EnvironmentID+"."+msg.RunID)
	errnat := messageq.MsgSend("coderunupdate."+msg.EnvironmentID+"."+msg.RunID, msg)
	if errnat != nil {
		if config.Debug == "true" {
			log.Println(errnat)
		}

	}

	sendmsg := modelmain.LogsSend{
		CreatedAt: time.Now().UTC(),
		UID:       uuid.NewString(),
		Log:       msg.Status,
		LogType:   "action",
	}

	messageq.MsgSend("coderunfilelogs."+msg.RunID, sendmsg)

	// }()

}
