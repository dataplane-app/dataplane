package routinetasks

import (
	"dataplane/mainapp/config"
	"dataplane/mainapp/database/models"
	"log"
	"strconv"

	"github.com/go-co-op/gocron"
	"gorm.io/gorm"
)

func CleanTasks(s *gocron.Scheduler, db *gorm.DB) {

	// var tasks models.WorkerTasks

	s.Every(1).Day().At("01:00").Do(func() {

		result := db.Where("created_at < NOW() - INTERVAL '? days'", config.CleanTasks).Delete(&models.WorkerTasks{})
		if config.Debug == "true" {
			log.Println("Removed old tasks")
		}

		db.Create(&models.LogsPlatform{
			EnvironmentID: "d_platform",
			Category:      "platform",
			LogType:       "info", //can be error, info or debug
			Log:           "Routine schedule: Clean tasks - count: " + strconv.Itoa(int(result.RowsAffected)),
		})

	})

}
