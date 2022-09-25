package scheduler

import (
	"log"

	dpconfig "github.com/dataplane-app/dataplane/app/mainapp/config"

	"github.com/dataplane-app/dataplane/app/mainapp/database"
	"github.com/dataplane-app/dataplane/app/mainapp/database/models"
	"github.com/dataplane-app/dataplane/app/mainapp/logging"

	"github.com/go-co-op/gocron"
)

func LoadPipelineSchedules() {

	// Clear any existing pipelines
	RemovePipelineSchedules()

	// ----------- Load the pipeline schedules -------------
	// log.Printf("%+v\n", dpconfig.Scheduler)
	// log.Println("Before loading:", dpconfig.Scheduler.Len())
	var pipelineSchedules []models.Scheduler
	err := database.DBConn.Where("online = true").Find(&pipelineSchedules).Error
	if err != nil {
		logging.PrintSecretsRedact("Platform nodes leader election:", err)

	}

	for _, s := range pipelineSchedules {

		LoadSingleSchedule(s)

	}

	if dpconfig.SchedulerDebug == "true" {
		var PipelineScheduler *gocron.Scheduler
		for i, v := range dpconfig.PipelineScheduler.Keys() {

			if tmp, ok := dpconfig.PipelineScheduler.Get(v); ok {

				PipelineScheduler = tmp.(*gocron.Scheduler)
				log.Println("Scheduler:", i, v, PipelineScheduler.IsRunning(), PipelineScheduler.Len())
			}
		}

		for i, v := range dpconfig.PipelineSchedulerJob.Keys() {

			if tmp, ok := dpconfig.PipelineSchedulerJob.Get(v); ok {

				PSJ := tmp.(*gocron.Job)
				log.Println("Scheduler Registered job:", i, v, PSJ.NextRun())
			}
		}
	}

}
