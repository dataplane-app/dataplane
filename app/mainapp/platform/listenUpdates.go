package platform

import (
	"dataplane/mainapp/config"
	"dataplane/mainapp/database"
	"dataplane/mainapp/database/models"
	"dataplane/mainapp/messageq"
	"dataplane/mainapp/scheduler"
	"log"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func PlatformNodeListen() {

	// Subscribe all nodes to the leader node
	messageq.NATSencoded.Subscribe("mainapp-node-update", func(subj, reply string, msg models.PlatformNodeUpdate) {

		// log.Println(msg)

		switch msg.Status {
		case "online":
			// log.Println(msg.NodeID, msg.Leader, msg.Status)
			UpdateLeader(msg.NodeID)
		}
	})

	// Subscribe to queue where worker is randomly chosen as leader
	messageq.NATSencoded.QueueSubscribe("mainapplead", "leadqueue", func(subj, reply string, msg models.PlatformNodeUpdate) {

		// log.Println("Message received:", msg)
		switch msg.Status {
		case "leaderelect":
			config.Leader = config.MainAppID

			// Elect myself as a leader
			err2 := database.DBConn.Model(&models.PlatformLeader{}).Clauses(clause.OnConflict{
				Columns:   []clause.Column{{Name: "leader"}},
				DoUpdates: clause.AssignmentColumns([]string{"updated_at"}),
			}).Create(map[string]interface{}{
				"leader":     true,
				"node_id":    config.MainAppID,
				"updated_at": gorm.Expr("now() at time zone 'utc'"),
			})
			if err2.Error != nil {
				log.Println(err2.Error.Error())
			}

			// Remove any schedules
			scheduler.RemovePipelineSchedules()

			// I am the leader, load schedules.
			if config.Leader == config.MainAppID {

				if config.Debug == "true" || config.SchedulerDebug == "true" {
					log.Println("Leader election:", config.Leader, config.MainAppID)
				}

				// Load the pipleine schedules
				scheduler.LoadPipelineSchedules()

			}

		}

	})
}
