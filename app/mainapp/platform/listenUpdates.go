package platform

import (
	"dataplane/mainapp/database/models"
	"dataplane/mainapp/messageq"
)

func PlatformNodeListen() {

	messageq.NATSencoded.Subscribe("mainapplead", func(subj, reply string, msg models.PlatformNodeUpdate) {

		// log.Println("Message received:", msg)
		switch msg.Status {
		case "online":
			RegisterNode(msg.NodeID)
		}

	})
}
