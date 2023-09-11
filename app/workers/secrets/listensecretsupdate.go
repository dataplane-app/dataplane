package secrets

import (
	"github.com/dataplane-app/dataplane/app/mainapp/messageq"
	wrkerconfig "github.com/dataplane-app/dataplane/app/workers/config"
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
