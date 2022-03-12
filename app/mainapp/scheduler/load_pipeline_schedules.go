package scheduler

import (
	"dataplane/mainapp/config"
	"dataplane/mainapp/database"
	"dataplane/mainapp/database/models"
	"dataplane/mainapp/logging"
	"log"
)

func LoadPipelineSchedules() {

	// Load the pipeline schedules
	// log.Printf("%+v\n", config.Scheduler)
	// log.Println("Before loading:", config.Scheduler.Len())
	var pipelineSchedules []models.Scheduler
	err := database.DBConn.Where("online = true").Find(&pipelineSchedules).Error
	if err != nil {
		logging.PrintSecretsRedact("Platform nodes leader election:", err)

	}

	for _, s := range pipelineSchedules {

		LoadSingleSchedule(s)

	}

	if config.Debug == "true" {
		for i, v := range config.PipelineScheduler {
			log.Println("Scheduler:", i, v.IsRunning(), v.Len())
		}
	}

}
