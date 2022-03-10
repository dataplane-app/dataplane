package scheduler

import "dataplane/mainapp/config"

func RemovePipelineSchedules() {

	// Remove any existing schedules
	_ = config.Scheduler.RemoveByTag("pipelines")

	// Load the pipeline schedules

}
