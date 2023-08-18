package runtask

import (
	"time"

	"github.com/dataplane-app/dataplane/app/mainapp/database"
	"github.com/dataplane-app/dataplane/app/mainapp/database/models"
	"github.com/dataplane-app/dataplane/app/workers/mqworker"
	"github.com/google/uuid"
)

/* Return errors to the logging console */
func WSLogError(logline string, msg models.WorkerTaskSend) {

	uidstring := uuid.NewString()
	sendmsg := models.LogsSend{
		CreatedAt:     time.Now().UTC(),
		UID:           uidstring,
		Log:           logline,
		LogType:       "error",
		EnvironmentID: msg.EnvironmentID,
		RunID:         msg.RunID,
	}

	mqworker.MsgSend("workerlogs."+msg.EnvironmentID+"."+msg.RunID+"."+msg.NodeID, sendmsg)
	database.DBConn.Create(&sendmsg)

}
