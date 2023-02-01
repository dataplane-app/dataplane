package worker

import (
	"encoding/json"
	"log"
	"time"

	"github.com/dataplane-app/dataplane/app/mainapp/database/models"
	wsockets "github.com/dataplane-app/dataplane/app/mainapp/websockets"
	"github.com/google/uuid"
)

/* Return errors to the logging console */
func WSTaskLogError(envID string, runID string, logline string, nodeID string) {

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

	// msg.Status = "Fail"
	// msg.RunID = runID
	// msg.EnvironmentID = envID
	// msg.EndedAt = time.Now().UTC()
	// msg.Reason = "Code run failed."
	// /* Send the closing message to say the run failed */
	// sendmsg = models.LogsSend{
	// 	CreatedAt:     time.Now().UTC(),
	// 	UID:           uuid.NewString(),
	// 	Log:           msg.Status,
	// 	LogType:       "action",
	// 	EnvironmentID: envID,
	// 	RunID:         runID,
	// }

	// jsonSend, errjson = json.Marshal(sendmsg)
	// if errjson != nil {
	// 	log.Println("Json marshal error: ", errjson)
	// }
	// wsockets.Broadcast <- wsockets.Message{Room: room, Data: jsonSend}

}
