package routinetasks

import (
	"dataplane/mainapp/config"
	"dataplane/mainapp/database/models"
	"log"

	"github.com/go-co-op/gocron"
	"gorm.io/gorm"
)

func CleanTasks(s *gocron.Scheduler, db *gorm.DB) {

	// var tasks models.WorkerTasks

	s.Every(1).Day().At("01:00").Do(func() {

		db.Where("created_at < NOW() - INTERVAL '? days'", config.CleanTasks).Delete(&models.WorkerTasks{})
		if config.Debug == "true" {
			log.Println("Removed old tasks")
		}

	})

}
