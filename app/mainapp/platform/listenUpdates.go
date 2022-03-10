package platform

import (
	"dataplane/mainapp/config"
	"dataplane/mainapp/database/models"
	"dataplane/mainapp/messageq"
	"dataplane/mainapp/scheduler"
	"log"
)

func PlatformNodeListen() {

	messageq.NATSencoded.Subscribe("mainapplead", func(subj, reply string, msg models.PlatformNodeUpdate) {

		// log.Println("Message received:", msg)
		switch msg.Status {
		case "online":
			// log.Println(msg.NodeID, msg.Leader, msg.Status)
			RegisterNode(msg.NodeID)
		case "leaderelect":
			config.Leader = msg.Leader
			// log.Println("Leader elected:", config.Leader)

			countbefore := config.Scheduler.Tag("pipeline").Len()

			// Remove any schedules
			scheduler.RemovePipelineSchedules()

			log.Println("Schedule removal count:", countbefore, config.Scheduler.Len())

			// I am the leader, load schedules.
			if config.Leader == config.MainAppID {
				log.Println("I am the leader:", config.Leader, config.MainAppID)

				// Load the pipleine schedules
				scheduler.LoadPipelineSchedules()

			}

		}

	})
}
