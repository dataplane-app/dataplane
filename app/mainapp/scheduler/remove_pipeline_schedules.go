package scheduler

import "dataplane/mainapp/config"

func RemovePipelineSchedules() {

	// Remove any existing schedules

	for _, ps := range config.PipelineScheduler {
		ps.Clear()
	}

	for key, _ := range config.PipelineSchedulerJob {
		delete(config.PipelineSchedulerJob, key)
	}

	// Load the pipeline schedules

}
