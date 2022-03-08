package secrets

import (
	"dataplane/workers/config"
	"dataplane/workers/messageq"
)

type TaskResponse struct {
	R string
	M string
}

func ListenSecretUpdates() {

	// Responding to a task request
	messageq.NATSencoded.Subscribe("updatesecrets."+config.WorkerGroup, func(subj, reply string, msg string) {
		// log.Println(msg)

		x := TaskResponse{R: "ok", M: "ok"}
		messageq.NATSencoded.Publish(reply, x)

	})

}
