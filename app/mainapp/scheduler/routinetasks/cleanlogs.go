package routinetasks

import (
	"dataplane/mainapp/config"
	"dataplane/mainapp/database/models"
	"log"
	"strconv"

	"github.com/go-co-op/gocron"
	"gorm.io/gorm"
)

func CleanWorkerLogs(s *gocron.Scheduler, db *gorm.DB) {

	s.Every(1).Days().At("02:00").Do(func() {

		result := db.Where("created_at < NOW() - INTERVAL '? days'", dpconfig.CleanLogs).Delete(&models.LogsWorkers{})
		if dpconfig.Debug == "true" {
			log.Println("Removed old worker logs")
		}

		db.Create(&models.LogsPlatform{
			EnvironmentID: "d_platform",
			Category:      "platform",
			LogType:       "info", //can be error, info or debug
			Log:           "Routine schedule: Clean worker logs - count: " + strconv.Itoa(int(result.RowsAffected)),
		})

	})

}
