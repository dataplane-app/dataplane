package scheduler

import (
	"dataplane/mainapp/config"
	"log"
	"time"

	"github.com/go-co-op/gocron"
)

func PipelineTimezoneScheduler(timezone string) error {

	if tmp, ok := config.PipelineScheduler.Get(timezone); ok {
		// if scheduler, ok := config.PipelineScheduler[timezone]; ok {
		//skip
		scheduler := tmp.(*gocron.Scheduler)
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

		config.PipelineScheduler.Set(timezone, gocron.NewScheduler(location))
		// config.PipelineScheduler[timezone] = gocron.NewScheduler(location)
		if tmp, ok := config.PipelineScheduler.Get(timezone); ok {
			scheduler := tmp.(*gocron.Scheduler)
			scheduler.StartAsync()
		}
	}
	return nil
}
