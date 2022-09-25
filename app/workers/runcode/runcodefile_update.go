package runcodeworker

import (
	"fmt"
	"log"
	"time"

	"github.com/dataplane-app/dataplane/app/mainapp/database/models"
	modelmain "github.com/dataplane-app/dataplane/app/mainapp/database/models"

	wrkerconfig "github.com/dataplane-app/dataplane/app/workers/config"
	"github.com/dataplane-app/dataplane/app/workers/database"
	"github.com/dataplane-app/dataplane/app/workers/messageq"

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

	errnat := messageq.MsgSend("coderunupdate."+msg.EnvironmentID+"."+msg.RunID, msg)
	if errnat != nil {
		if wrkerconfig.Debug == "true" {
			log.Println(errnat)
		}

	}

	/*
		Send back complete action
		stop.Sub(start)
	*/
	runtime := time.Now().UTC().Sub(msg.CreatedAt)

	if msg.Status == "Fail" || msg.Status == "Success" {
		sendmsg := modelmain.LogsSend{
			CreatedAt: time.Now().UTC(),
			UID:       uuid.NewString(),
			Log:       fmt.Sprintf("Run time: %v", runtime),
			LogType:   "action",
		}

		messageq.MsgSend("coderunfilelogs."+msg.RunID, sendmsg)
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
