package scheduler

import (
	"dataplane/mainapp/config"
	"dataplane/mainapp/database"
	"dataplane/mainapp/database/models"
	"dataplane/mainapp/messageq"
	"log"

	"github.com/go-co-op/gocron"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func PipelineSchedulerListen() {

	// Subscribe to scheduling updates
	messageq.NATSencoded.Subscribe("pipeline-scheduler", func(subj, reply string, msg models.Scheduler) {

		if config.MainAppID == config.Leader {

			var PipelineScheduler *gocron.Scheduler
			var PipelineSJob *gocron.Job

			// Remove existing trigger from schedule
			// ----- Delete schedules
			var plSchedules []*models.Scheduler
			err := database.DBConn.Where("pipeline_id = ?", msg.PipelineID).Find(&plSchedules).Error
			if err != nil && err != gorm.ErrRecordNotFound {
				log.Println("Removal of changed trigger schedules:", err)
			}

			if len(plSchedules) > 0 {
				for _, psc := range plSchedules {

					// remove from scheduler -- can't be done here, needs to be removed on leader node

					// log.Println("Scheduler remove by id: ", psc.Timezone, psc.NodeID, "Q")
					if tmp, ok := config.PipelineScheduler.Get(psc.Timezone); ok {

						PipelineScheduler = tmp.(*gocron.Scheduler)

						if tmp, ok := config.PipelineSchedulerJob.Get(psc.NodeID); ok {

							PipelineSJob = tmp.(*gocron.Job)

							if config.SchedulerDebug == "true" {
								log.Println("Scheduler remove by id: ", psc.Timezone, psc.NodeID, "ok")
							}
							PipelineScheduler.RemoveByReference(PipelineSJob)
							config.PipelineSchedulerJob.Remove(psc.NodeID)
							// delete(config.PipelineSchedulerJob, psc.NodeID)

						}
					}

					// remove from database
					err := database.DBConn.Where("pipeline_id = ? and node_id=?", psc.PipelineID, psc.NodeID).Delete(&models.Scheduler{}).Error
					if err != nil {
						log.Println("Removal of of changed trigger schedules:", err, psc.NodeID)

					}
				}

			}

			// Update database
			err = database.DBConn.Clauses(clause.OnConflict{
				UpdateAll: true,
			}).Create(&msg).Error

			if err != nil {
				log.Println("Update scheduler db from nats:", err)
			}

			LoadSingleSchedule(msg)

			if config.SchedulerDebug == "true" {
				for i, v := range config.PipelineScheduler.Keys() {

					if tmp, ok := config.PipelineScheduler.Get(v); ok {

						PipelineScheduler = tmp.(*gocron.Scheduler)
						log.Println("Scheduler:", i, v, PipelineScheduler.IsRunning(), PipelineScheduler.Len())
					}
				}

				for i, v := range config.PipelineSchedulerJob.Keys() {

					if tmp, ok := config.PipelineSchedulerJob.Get(v); ok {

						PSJ := tmp.(*gocron.Job)
						log.Println("Scheduler Registered job:", i, v, PSJ.NextRun())
					}
				}
			}
		}

	})
}
