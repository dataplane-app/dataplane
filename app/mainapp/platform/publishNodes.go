package platform

import (
	"dataplane/mainapp/config"
	"dataplane/mainapp/database"
	"dataplane/mainapp/database/models"
	"dataplane/mainapp/messageq"
	"dataplane/mainapp/scheduler"
	"dataplane/workers/logging"
	"log"

	"github.com/go-co-op/gocron"
	"gorm.io/gorm"
)

func PlatformNodePublish(s *gocron.Scheduler, db *gorm.DB, mainAppID string) {

	s.Every(500).Milliseconds().Do(func() {

		// log.Println("Leader ID:", dpconfig.Leader)
		// Is there a leader?
		var leader models.PlatformLeader
		err2 := database.DBConn.First(&leader)
		if err2.Error != nil && err2.Error != gorm.ErrRecordNotFound {
			log.Println(err2.Error.Error())
		}

		// if leader has changed
		if dpconfig.Leader != leader.NodeID {

			if dpconfig.SchedulerDebug == "true" {
				log.Println("Publish: Changed leader: ", dpconfig.Leader, "->", leader.NodeID)
			}

			// Remove any schedules if there is a change in leader and this node is not the leader
			if dpconfig.MainAppID != dpconfig.Leader {
				if dpconfig.SchedulerDebug == "true" {
					log.Println("Not leader, removed any schedules.")
				}
				scheduler.RemovePipelineSchedules()
			}
		}

		// if no leader found, elect a leader
		if err2.Error == gorm.ErrRecordNotFound {
			LeaderElection()
		} else {
			dpconfig.Leader = leader.NodeID
		}

		// log.Println("Publish leader: ", dpconfig.Leader)

		var data = models.PlatformNodeUpdate{
			NodeID: mainAppID,
			Leader: dpconfig.Leader,
			Status: "online",
		}
		err := messageq.MsgSend("mainapp-node-update", data)
		if err != nil {
			logging.PrintSecretsRedact("NATS error:", err)
		}

	})

}
