package config

import (
	"os"
	"strconv"

	"github.com/go-co-op/gocron"
	cmap "github.com/orcaman/concurrent-map"
)

// Platform
var PlatformID string
var MainAppID string = ""
var Leader string = ""

/* Routine removal of stale data */
var CleanTasks int = 30
var CleanLogs int = 30

// Scheduler
var PipelineScheduler = cmap.New()
var PipelineSchedulerJob = cmap.New()
var Scheduler *gocron.Scheduler

// var PipelineScheduler = make(map[string]*gocron.Scheduler)
// var PipelineSchedulerJob = make(map[string]*gocron.Job)

// Debug
var Debug string = "false"
var SchedulerDebug string = "false"

// Code editor
var CodeDirectory string

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

	CodeDirectory = os.Getenv("dataplane_code_folder")

}
