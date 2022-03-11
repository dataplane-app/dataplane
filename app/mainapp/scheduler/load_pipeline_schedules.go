package scheduler

import (
	"dataplane/mainapp/config"
	"dataplane/mainapp/database"
	"dataplane/mainapp/database/models"
	"dataplane/mainapp/logging"
	"log"

	"gorm.io/gorm"
)

func LoadPipelineSchedules() {

	// Load the pipeline schedules
	// log.Printf("%+v\n", config.Scheduler)
	// log.Println("Before loading:", config.Scheduler.Len())
	var pipelineSchedules []*models.Scheduler
	err := database.DBConn.Where("online = true").Find(&pipelineSchedules).Error
	if err != nil {
		logging.PrintSecretsRedact("Platform nodes leader election:", err)

	}

	for _, s := range pipelineSchedules {

		switch s.ScheduleType {
		case "cron":

			err := PipelineTimezoneScheduler(s.Timezone)

			log.Println("Error schedule create:", err)
			if err == nil {

				log.Println("Creating: ", s.NodeID, s.Timezone, s.Schedule)

				_, _ = config.PipelineScheduler[s.Timezone].Tag("pipelines", s.NodeID).Cron(s.Schedule).Do(mytask, s.NodeID, s.EnvironmentID, s.Timezone)

				log.Println(config.PipelineScheduler[s.Timezone].Len(), "Timezone: "+s.Timezone)
			}
		case "cronseconds":

			err := PipelineTimezoneScheduler(s.Timezone)
			// log.Println("Error schedule create:", err)
			if err == nil {

				config.PipelineScheduler[s.Timezone].Tag("pipelines", s.NodeID).CronWithSeconds(s.Schedule).Do(mytask, s.NodeID, s.EnvironmentID, s.Timezone)

			}

		}

	}

	for i, v := range config.PipelineScheduler {
		log.Println("Scheduler:", i, v.IsRunning(), v.Len())
	}

}

func mytask(nodeID string, environmentID string, timezone string) {

	log.Println("Trigger me", nodeID, timezone)

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
