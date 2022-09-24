package platform

import (
	"log"

	dpconfig "github.com/dataplane-app/dataplane/mainapp/config"

	"github.com/dataplane-app/dataplane/mainapp/database"
	"github.com/dataplane-app/dataplane/mainapp/database/models"
	"github.com/dataplane-app/dataplane/mainapp/messageq"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func PlatformNodeListen() {

	// Clear stale leaders on spin up
	err2 := database.DBConn.Exec(`
		delete from platform_leader where updated_at < now() at time zone 'utc' - INTERVAL '2 seconds'
		`)
	if err2.Error != nil {
		log.Println(err2.Error.Error())
	}

	// Subscribe all nodes to the leader node
	messageq.NATSencoded.QueueSubscribe("mainapp-node-update", "mainapp-node-update", func(subj, reply string, msg models.PlatformNodeUpdate) {

		// log.Println("Updated", msg.Leader == msg.NodeID)
		// log.Println("Loaded leader", dpconfig.Leader)

		switch msg.Status {
		case "online":
			// log.Println(msg.NodeID, msg.Leader, msg.Status)
			nodeID := msg.NodeID

			// Remove all leaders older than 2 seconds
			err2 := database.DBConn.Exec(`
	delete from platform_leader where updated_at < now() at time zone 'utc' - INTERVAL '2 seconds'
	`)
			if err2.Error != nil {
				log.Println(err2.Error.Error())
			}

			// If the the leader is the current node, update the time using postgresql clock to avoid time drift
			// This part will not run if no leader is found
			if dpconfig.Leader == nodeID {
				err2 = database.DBConn.Model(&models.PlatformLeader{}).Clauses(clause.OnConflict{
					Columns:   []clause.Column{{Name: "leader"}},
					DoUpdates: clause.AssignmentColumns([]string{"updated_at"}),
				}).Create(map[string]interface{}{
					"leader":     true,
					"node_id":    nodeID,
					"updated_at": gorm.Expr("now() at time zone 'utc'"),
				})
				if err2.Error != nil {
					log.Println(err2.Error.Error())
				}
			}

			// Remove all scheduler lease locks older than 2 seconds
			err2 = database.DBConn.Exec(`
	delete from scheduler_lock where lock_lease < now() at time zone 'utc' - INTERVAL '2 seconds'
	`)
			if err2.Error != nil {
				log.Println(err2.Error.Error())
			}
		}
	})

}
