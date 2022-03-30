package scheduler

import (
	"dataplane/mainapp/config"
	"dataplane/mainapp/database"
	"dataplane/mainapp/database/models"
	"dataplane/mainapp/logging"
	"dataplane/mainapp/pipelines"
	"log"

	"github.com/go-co-op/gocron"
	"gorm.io/gorm"
)

func mytask(nodeID string, pipelineID string, environmentID string, timezone string) {

	if config.SchedulerDebug == "true" {
		log.Println("Schedule run:", nodeID, timezone)
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

	_, err := pipelines.RunPipeline(pipelineID, environmentID)
	if err != nil {
		if config.SchedulerDebug == "true" {
			logging.PrintSecretsRedact("Pipeline schedule run error:", err)
		}
	}

}

func LoadSingleSchedule(s models.Scheduler) {

	var PipelineScheduler *gocron.Scheduler

	switch s.ScheduleType {

	case "cron":

		err := PipelineTimezoneScheduler(s.Timezone)

		if err == nil && s.Online {

			if tmp, ok := config.PipelineScheduler.Get(s.Timezone); ok {
				PipelineScheduler = tmp.(*gocron.Scheduler)
			}

			PSJob, _ := PipelineScheduler.Cron(s.Schedule).Do(mytask, s.NodeID, s.PipelineID, s.EnvironmentID, s.Timezone)
			config.PipelineSchedulerJob.Set(s.NodeID, PSJob)
		}
	case "cronseconds":

		err := PipelineTimezoneScheduler("UTC")

		if err == nil && s.Online {

			if tmp, ok := config.PipelineScheduler.Get("UTC"); ok {
				PipelineScheduler = tmp.(*gocron.Scheduler)
			}

			PSJob, _ := PipelineScheduler.CronWithSeconds(s.Schedule).Do(mytask, s.NodeID, s.PipelineID, s.EnvironmentID, "UTC")
			config.PipelineSchedulerJob.Set(s.NodeID, PSJob)

		}

	}

	if config.SchedulerDebug == "true" {
		log.Println("Scheduler add: ", s.Timezone, s.NodeID, "Online:", s.Online)
	}

}
