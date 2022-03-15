package platform

import (
	"dataplane/mainapp/config"
	"dataplane/mainapp/database"
	"dataplane/mainapp/database/models"
	"dataplane/mainapp/scheduler"
	"log"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func LeaderElection() {

	// Elect myself as a leader
	err2 := database.DBConn.Model(&models.PlatformLeader{}).Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "leader"}},
		DoUpdates: clause.AssignmentColumns([]string{"updated_at"}),
	}).Create(map[string]interface{}{
		"leader":     true,
		"node_id":    config.MainAppID,
		"updated_at": gorm.Expr("now() at time zone 'utc'"),
	})
	if err2.Error != nil {
		log.Println(err2.Error.Error())
	}

	config.Leader = config.MainAppID

	// Remove any schedules
	scheduler.RemovePipelineSchedules()

	// I am the leader, load schedules.
	if config.Leader == config.MainAppID {

		if config.Debug == "true" || config.SchedulerDebug == "true" {
			log.Println("Leader election:", config.MainAppID, config.Leader == config.MainAppID)
		}

		// Load the pipleine schedules
		scheduler.LoadPipelineSchedules()
		if config.Debug == "true" || config.SchedulerDebug == "true" {
			log.Println("Schedules loaded.")
		}

	}

	// }

}
