package worker

import (
	"encoding/json"
	"log"
	"time"

	"github.com/dataplane-app/dataplane/app/mainapp/database"
	"github.com/dataplane-app/dataplane/app/mainapp/database/models"
	"github.com/dataplane-app/dataplane/app/mainapp/logging"
	wsockets "github.com/dataplane-app/dataplane/app/mainapp/websockets"
	"github.com/google/uuid"
)

/* Return errors to the logging console */
func WSTaskLogError(envID string, runID string, logline string, nodeID string, taskID string) {

	/* Send the error log */
	uidstring := uuid.NewString()
	sendmsg := models.LogsSend{
		CreatedAt:     time.Now().UTC(),
		UID:           uidstring,
		Log:           logline,
		LogType:       "error",
		EnvironmentID: envID,
		RunID:         runID,
	}

	jsonSend, errjson := json.Marshal(sendmsg)
	if errjson != nil {
		log.Println("Json marshal error: ", errjson)
	}

	room := "workerlogs." + envID + "." + runID + "." + nodeID
	wsockets.Broadcast <- wsockets.Message{Room: room, Data: jsonSend}

	/* Below commented out for in future to show extra details to front end */

	recordlog := models.LogsWorkers{
		CreatedAt:     time.Now().UTC(),
		EnvironmentID: envID,
		Category:      "task",
		UID:           uuid.NewString(),
		RunID:         runID,
		NodeID:        nodeID,
		TaskID:        taskID,
		Log:           logline,
		LogType:       "error",
	}

	err2 := database.DBConn.Create(&recordlog)
	if err2.Error != nil {
		logging.PrintSecretsRedact(err2.Error.Error())
	}

}
