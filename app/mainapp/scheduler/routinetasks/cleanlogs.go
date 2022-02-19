package routinetasks

import (
	"dataplane/mainapp/config"
	"dataplane/mainapp/database/models"
	"log"

	"github.com/go-co-op/gocron"
	"gorm.io/gorm"
)

func CleanWorkerLogs(s *gocron.Scheduler, db *gorm.DB) {

	s.Every(1).Days().At("02:00").Do(func() {

		db.Where("created_at < NOW() - INTERVAL '? days'", config.CleanLogs).Delete(&models.LogsWorkers{})
		if config.Debug == "true" {
			log.Println("Removed old worker logs")
		}

	})

}
