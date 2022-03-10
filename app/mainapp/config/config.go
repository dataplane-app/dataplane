package config

import (
	"os"
	"strconv"

	"github.com/go-co-op/gocron"
)

/* Routine removal of stale data */
var CleanTasks int = 30
var CleanLogs int = 30
var Leader string = ""
var MainAppID string = ""
var Scheduler *gocron.Scheduler

// Debug
var Debug string = "false"

func LoadConfig() {

	// Clean tasks set
	if os.Getenv("dp_cleantasks_days") != "" {
		CleanTasks, _ = strconv.Atoi(os.Getenv("dp_cleantasks_days"))
	}

	if os.Getenv("dp_removelogs_days") != "" {
		CleanTasks, _ = strconv.Atoi(os.Getenv("dp_removelogs_days"))
	}

	if os.Getenv("debug") != "true" {
		Debug = os.Getenv("debug")
	}

}
