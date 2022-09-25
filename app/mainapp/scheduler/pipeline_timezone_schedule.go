package scheduler

import (
	"log"
	"time"

	dpconfig "github.com/dataplane-app/dataplane/app/mainapp/config"

	"github.com/go-co-op/gocron"
)

func PipelineTimezoneScheduler(timezone string) error {

	if tmp, ok := dpconfig.PipelineScheduler.Get(timezone); ok {
		// if scheduler, ok := dpconfig.PipelineScheduler[timezone]; ok {
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

		dpconfig.PipelineScheduler.Set(timezone, gocron.NewScheduler(location))
		// dpconfig.PipelineScheduler[timezone] = gocron.NewScheduler(location)
		if tmp, ok := dpconfig.PipelineScheduler.Get(timezone); ok {
			scheduler := tmp.(*gocron.Scheduler)
			scheduler.StartAsync()
		}
	}
	return nil
}
