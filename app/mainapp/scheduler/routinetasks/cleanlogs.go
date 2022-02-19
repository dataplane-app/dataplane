package routinetasks

import (
	"dataplane/mainapp/config"
	"dataplane/mainapp/database/models"
	"dataplane/workers/database"
	"log"

	"github.com/go-co-op/gocron"
)

func CleanWorkerLogs(s *gocron.Scheduler) {

	var records models.LogsWorkers

	s.Every(1).Days().At("02:00").Do(func() {

		database.DBConn.Where("created_at < NOW() - INTERVAL '? days'", config.CleanLogs).Delete(&records)
		if config.Debug == "true" {
			log.Println("Removed old worker logs")
		}

	})

}
