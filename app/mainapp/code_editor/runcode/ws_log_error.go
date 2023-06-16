package runcode

import (
	"encoding/json"
	"log"
	"time"

	"github.com/dataplane-app/dataplane/app/mainapp/database/models"
	wsockets "github.com/dataplane-app/dataplane/app/mainapp/websockets"
	"github.com/google/uuid"
)

/* Return errors to the logging console */
func WSLogError(envID string, runID string, logline string, msg models.CodeRun) {

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

	room := "coderunfilelogs." + envID + "." + runID
	wsockets.Broadcast <- wsockets.Message{Room: room, Data: jsonSend}

	msg.Status = "Fail"
	msg.RunID = runID
	msg.EnvironmentID = envID
	msg.EndedAt = time.Now().UTC()
	msg.Reason = "Code run failed."
	/* Send the closing message to say the run failed */
	sendmsg = models.LogsSend{
		CreatedAt:     time.Now().UTC(),
		UID:           uuid.NewString(),
		Log:           msg.Status,
		LogType:       "action",
		EnvironmentID: envID,
		RunID:         runID,
	}

	jsonSend, errjson = json.Marshal(sendmsg)
	if errjson != nil {
		log.Println("Json marshal error: ", errjson)
	}
	wsockets.Broadcast <- wsockets.Message{Room: room, Data: jsonSend}

	UpdateCodeRun(msg)
}
