package scheduler

import (
	dpconfig "github.com/dataplane-app/dataplane/mainapp/config"

	"github.com/go-co-op/gocron"
)

func RemovePipelineSchedules() {

	// Remove any existing schedules

	for _, v := range dpconfig.PipelineScheduler.Keys() {
		if tmp, ok := dpconfig.PipelineScheduler.Get(v); ok {

			PipelineScheduler := tmp.(*gocron.Scheduler)
			PipelineScheduler.Clear()

		}
	}

	for _, v := range dpconfig.PipelineSchedulerJob.Keys() {

		dpconfig.PipelineSchedulerJob.Remove(v)
	}

	// Load the pipeline schedules

}
