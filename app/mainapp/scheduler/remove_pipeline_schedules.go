package scheduler

import "dataplane/mainapp/config"

func RemovePipelineSchedules() {

	// Remove any existing schedules

	for _, ps := range config.PipelineScheduler {
		_ = ps.RemoveByTag("pipelines")
	}

	// Load the pipeline schedules

}
