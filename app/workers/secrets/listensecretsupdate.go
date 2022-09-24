package secrets

import (
	wrkerconfig "dataplane/workers/config"
	"dataplane/workers/messageq"
)

type TaskResponse struct {
	R string
	M string
}

func ListenSecretUpdates() {

	// Responding to a task request
	messageq.NATSencoded.Subscribe("updatesecrets."+wrkerconfig.WorkerGroup, func(subj, reply string, msg string) {
		// log.Println(msg)

		MapSecrets()

		// logging.PrintSecretsRedact("Test replacement:", "hello")

		x := TaskResponse{R: "ok", M: "ok"}
		messageq.NATSencoded.Publish(reply, x)

	})

}
