package scheduler

import (
	"context"
	"log"
	"time"

	dpconfig "github.com/dataplane-app/dataplane/app/mainapp/config"
	"github.com/go-redis/redis/v8"

	"github.com/dataplane-app/dataplane/app/mainapp/database"
	"github.com/dataplane-app/dataplane/app/mainapp/database/models"
	"github.com/dataplane-app/dataplane/app/mainapp/logging"
	"github.com/dataplane-app/dataplane/app/mainapp/pipelines"

	"github.com/go-co-op/gocron"
	"github.com/google/uuid"
)

func mytask(nodeID string, pipelineID string, environmentID string, timezone string, runType string) {

	ctx := context.Background()

	if dpconfig.SchedulerDebug == "true" {
		log.Println("Schedule run:", nodeID, timezone)
	}

	// Is there a lock on this run?
	val, errlock := database.RedisConn.Get(ctx, environmentID+"-"+nodeID+"-sch-lock").Result()
	if errlock != nil && errlock != redis.Nil {
		log.Println("Scheduled lock error:", nodeID, errlock)
		return
	}

	// If there is a lock then stop the run else create a lock for 1 second
	if val == "l" {
		log.Println("Lock already exists, scheduled lock could not be obtained", nodeID)
		return
	} else {
		_, err := database.RedisConn.SetNX(ctx, environmentID+"-"+nodeID+"-sch-lock", "l", 1*time.Second).Result()
		if err != nil {
			log.Println("Scheduled create lock error:", nodeID, err)
			return
		}
	}

	// err2 := database.DBConn.Model(&models.SchedulerLock{}).Create(map[string]interface{}{
	// 	"node_id":        nodeID,
	// 	"environment_id": environmentID,
	// 	"lock_lease":     gorm.Expr("now() at time zone 'utc'"),
	// })

	// if err2.Error != nil {
	// 	log.Println("Lock could not be obtained", nodeID, err2.Error.Error())
	// 	return
	// }
	runID := uuid.NewString()
	var err error
	switch runType {
	case "pipeline":
		_, err = pipelines.RunPipeline(pipelineID, environmentID, runID)
	case "deployment":
		_, err = pipelines.RunDeployment(pipelineID, environmentID, runID, "latest")
	default:
		log.Println("Run type not provided in scheduler.")
		return
	}

	if err != nil {
		if dpconfig.SchedulerDebug == "true" {
			logging.PrintSecretsRedact(runType+" schedule run error:", err)
		}
	}

}

func LoadSingleSchedule(s models.Scheduler) {

	var PipelineScheduler *gocron.Scheduler

	switch s.ScheduleType {

	case "cron":

		err := PipelineTimezoneScheduler(s.Timezone)

		if err == nil && s.Online {

			if tmp, ok := dpconfig.PipelineScheduler.Get(s.Timezone); ok {
				PipelineScheduler = tmp.(*gocron.Scheduler)
			}

			PSJob, _ := PipelineScheduler.Cron(s.Schedule).Do(mytask, s.NodeID, s.PipelineID, s.EnvironmentID, s.Timezone, s.RunType)
			dpconfig.PipelineSchedulerJob.Set(s.NodeID, PSJob)
		}
	case "cronseconds":

		err := PipelineTimezoneScheduler("UTC")

		if err == nil && s.Online {

			if tmp, ok := dpconfig.PipelineScheduler.Get("UTC"); ok {
				PipelineScheduler = tmp.(*gocron.Scheduler)
			}

			PSJob, _ := PipelineScheduler.CronWithSeconds(s.Schedule).Do(mytask, s.NodeID, s.PipelineID, s.EnvironmentID, "UTC", s.RunType)
			dpconfig.PipelineSchedulerJob.Set(s.NodeID, PSJob)

		}

	}

	if dpconfig.SchedulerDebug == "true" {
		log.Println("Scheduler add: ", s.Timezone, s.NodeID, "Online:", s.Online, s.RunType)
	}

}
