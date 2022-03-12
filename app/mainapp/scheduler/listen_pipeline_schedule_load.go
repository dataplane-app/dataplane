package scheduler

import (
	"dataplane/mainapp/config"
	"dataplane/mainapp/database"
	"dataplane/mainapp/database/models"
	"dataplane/mainapp/messageq"
	"log"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func PipelineSchedulerListen() {

	// Subscribe to scheduling updates
	messageq.NATSencoded.Subscribe("pipeline-scheduler", func(subj, reply string, msg models.Scheduler) {

		if config.MainAppID == config.Leader {

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

					log.Println("Scheduler remove by tag: ", psc.Timezone, psc.NodeID, "Q")
					if _, ok := config.PipelineScheduler[psc.Timezone]; ok {

						log.Println("Scheduler remove by tag: ", psc.Timezone, psc.NodeID, "ok")
						config.PipelineScheduler[psc.Timezone].RemoveByReference(config.PipelineSchedulerJob[psc.NodeID])
						delete(config.PipelineSchedulerJob, psc.NodeID)

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

			if config.Debug == "true" {
				for i, v := range config.PipelineScheduler {
					log.Println("Scheduler:", i, v.IsRunning(), v.Len())
					// jobs := v.Jobs()
					// for _, x := range jobs {
					// 	log.Printf("%+v\n", x)
					// }
				}
			}
		}

	})
}
