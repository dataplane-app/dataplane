package scheduler

import (
	"dataplane/mainapp/config"
	"log"
	"time"

	"github.com/go-co-op/gocron"
)

func PipelineTimezoneScheduler(timezone string) error {

	if scheduler, ok := config.PipelineScheduler[timezone]; ok {
		//skip
		if scheduler.IsRunning() {
			return nil
		} else {
			scheduler.StartAsync()
			return nil
		}

	} else {
		// Create scheduler for this timezone
		location, err := time.LoadLocation(timezone)
		if err != nil {
			log.Println("Error with pipeline scheduler: ", timezone, err)
			return err
		}
		config.PipelineScheduler[timezone] = gocron.NewScheduler(location)
		config.PipelineScheduler[timezone].StartAsync()
	}
	return nil
}
