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
	log.Println("Before loading:", config.Scheduler.Len())
	var pipelineSchedules []*models.Scheduler
	err := database.DBConn.Find(&pipelineSchedules).Error
	if err != nil {
		logging.PrintSecretsRedact("Platform nodes leader election:", err)

	}

	for _, s := range pipelineSchedules {

		switch s.ScheduleType {
		case "cron":

			log.Println(s.Schedule)

			sc, _ := config.Scheduler.Tag("pipelines", s.NodeID).Cron(s.Schedule).Do(func() {
				log.Println("Trigger me")
				_, time := config.Scheduler.NextRun()
				log.Println(time)
			})

			log.Println(sc, config.Scheduler.Len())
		}

	}

}
