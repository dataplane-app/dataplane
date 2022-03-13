package scheduler

import (
	"dataplane/mainapp/config"
	"dataplane/mainapp/database"
	"dataplane/mainapp/database/models"
	"dataplane/mainapp/logging"
	"log"

	"github.com/go-co-op/gocron"
)

func LoadPipelineSchedules() {

	// Clear any existing pipelines
	RemovePipelineSchedules()

	// ----------- Load the pipeline schedules -------------
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

	if config.SchedulerDebug == "true" {
		var PipelineScheduler *gocron.Scheduler
		for i, v := range config.PipelineScheduler.Keys() {

			if tmp, ok := config.PipelineScheduler.Get(v); ok {

				PipelineScheduler = tmp.(*gocron.Scheduler)
				log.Println("Scheduler:", i, v, PipelineScheduler.IsRunning(), PipelineScheduler.Len())
			}
		}

		for i, v := range config.PipelineSchedulerJob {
			log.Println("Scheduler Registered job:", i, v.NextRun())
		}
	}

}
