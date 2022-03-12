package scheduler

import (
	"dataplane/mainapp/config"
	"dataplane/mainapp/database"
	"dataplane/mainapp/database/models"
	"log"

	"gorm.io/gorm"
)

func mytask(nodeID string, environmentID string, timezone string) {

	if config.Debug == "true" {
		log.Println("Trigger me", nodeID, timezone)
	}

	err2 := database.DBConn.Model(&models.SchedulerLock{}).Create(map[string]interface{}{
		"node_id":        nodeID,
		"environment_id": environmentID,
		"lock_lease":     gorm.Expr("now() at time zone 'utc'"),
	})

	if err2.Error != nil {
		log.Println("Lock could not be obtained", nodeID, err2.Error.Error())
		return
	}

}

func LoadSingleSchedule(s models.Scheduler) {

	switch s.ScheduleType {
	case "cron":

		err := PipelineTimezoneScheduler(s.Timezone)

		if err == nil && s.Online {

			_, _ = config.PipelineScheduler[s.Timezone].Tag("pipelines", s.NodeID).Cron(s.Schedule).Do(mytask, s.NodeID, s.EnvironmentID, s.Timezone)

		}
	case "cronseconds":

		err := PipelineTimezoneScheduler(s.Timezone)

		if err == nil && s.Online {

			config.PipelineScheduler[s.Timezone].Tag("pipelines", s.NodeID).CronWithSeconds(s.Schedule).Do(mytask, s.NodeID, s.EnvironmentID, s.Timezone)

		}

	}

}
