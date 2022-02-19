package routinetasks

import (
	"dataplane/mainapp/config"
	"dataplane/mainapp/database/models"
	"dataplane/workers/database"
	"log"

	"github.com/go-co-op/gocron"
)

func CleanTasks(s *gocron.Scheduler) {

	var tasks models.WorkerTasks

	s.Every(1).Days().At("01:00").Do(func() {

		database.DBConn.Where("created_at < NOW() - INTERVAL '? days'", config.CleanTasks).Delete(&tasks)
		if config.Debug == "true" {
			log.Println("Removed old tasks")
		}

	})

}
