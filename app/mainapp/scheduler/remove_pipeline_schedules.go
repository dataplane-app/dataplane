package scheduler

import (
	"dataplane/mainapp/config"

	"github.com/go-co-op/gocron"
)

func RemovePipelineSchedules() {

	// Remove any existing schedules

	for _, v := range config.PipelineScheduler.Keys() {
		if tmp, ok := config.PipelineScheduler.Get(v); ok {

			PipelineScheduler := tmp.(*gocron.Scheduler)
			PipelineScheduler.Clear()

		}
	}

	for _, v := range config.PipelineSchedulerJob.Keys() {

		config.PipelineSchedulerJob.Remove(v)
	}

	// Load the pipeline schedules

}
