package platform

import (
	"dataplane/mainapp/database/models"
	"dataplane/mainapp/messageq"
	"log"
)

func LeaderElection() {

	// Let everyone know who the new leader is
	var data = models.PlatformNodeUpdate{
		Status: "leaderelect",
	}

	err := messageq.MsgSend("mainapplead", data)
	if err != nil {
		log.Println("NATS error:", err)
	}

	// }

}
