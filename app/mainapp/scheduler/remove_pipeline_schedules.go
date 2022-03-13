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

	for key, _ := range config.PipelineSchedulerJob {
		delete(config.PipelineSchedulerJob, key)
	}

	// Load the pipeline schedules

}
