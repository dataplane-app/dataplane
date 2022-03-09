package platform

import (
	"dataplane/mainapp/config"
	"dataplane/mainapp/database/models"
	"dataplane/mainapp/messageq"
	"dataplane/workers/logging"

	"github.com/go-co-op/gocron"
	"gorm.io/gorm"
)

func PlatformNodePublish(s *gocron.Scheduler, db *gorm.DB, mainAppID string) {

	s.Every(1).Second().Do(func() {

		// log.Println("Platform ID:", mainAppID)
		var data = models.PlatformNodeUpdate{
			NodeID: mainAppID,
			Leader: config.Leader,
			Status: "online",
		}
		err := messageq.MsgSend("mainapplead", data)
		if err != nil {
			logging.PrintSecretsRedact("NATS error:", err)
		}

	})

}
