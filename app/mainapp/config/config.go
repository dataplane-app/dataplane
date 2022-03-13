package config

import (
	"os"
	"strconv"

	"github.com/go-co-op/gocron"
	cmap "github.com/orcaman/concurrent-map"
)

/* Routine removal of stale data */
var CleanTasks int = 30
var CleanLogs int = 30
var Leader string = ""
var MainAppID string = ""
var Scheduler *gocron.Scheduler

// Needs concurrency safety:
var PipelineScheduler = cmap.New()

// var PipelineScheduler = make(map[string]*gocron.Scheduler)
var PipelineSchedulerJob = make(map[string]*gocron.Job)

// Debug
var Debug string = "false"
var SchedulerDebug string = "false"

func LoadConfig() {

	// Clean tasks set

	CleanTasks, _ = strconv.Atoi(os.Getenv("dp_cleantasks_days"))
	if CleanTasks == 0 {
		CleanTasks = 30
	}

	CleanLogs, _ = strconv.Atoi(os.Getenv("dp_removelogs_days"))
	if CleanLogs == 0 {
		CleanLogs = 30
	}

	Debug = os.Getenv("debug")
	if Debug == "" {
		Debug = "false"
	}

	SchedulerDebug = os.Getenv("schedulerdebug")
	if SchedulerDebug == "" {
		SchedulerDebug = "false"
	}

}
