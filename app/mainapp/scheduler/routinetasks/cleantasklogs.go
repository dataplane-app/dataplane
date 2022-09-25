package routinetasks

import (
	"log"
	"strconv"

	dpconfig "github.com/dataplane-app/dataplane/app/mainapp/config"

	"github.com/dataplane-app/dataplane/app/mainapp/database/models"

	"github.com/go-co-op/gocron"
	"gorm.io/gorm"
)

func CleanTaskLocks(s *gocron.Scheduler, db *gorm.DB) {

	s.Every(1).Days().At("02:00").Do(func() {

		result := db.Where("created_at < NOW() - INTERVAL '? days'", "1").Delete(&models.WorkerTaskLock{})
		if dpconfig.Debug == "true" {
			log.Println("Removed old task locks")
		}

		db.Create(&models.LogsPlatform{
			EnvironmentID: "d_platform",
			Category:      "platform",
			LogType:       "info", //can be error, info or debug
			Log:           "Routine schedule: Clean task locks - count: " + strconv.Itoa(int(result.RowsAffected)),
		})

	})

}
