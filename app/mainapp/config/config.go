package dpconfig

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
var MQDebug string = "false"

// Environment variables
var CodeDirectory string
var DPDatabase string = ""

// File storage
var FSCodeFileStorage string
var FSCodeFileBatches int
var FSCodeDirectory string

// Redis
var DPRedisHost string
var DPRedisPort string
var DPRedisDB int
var DPRedisPassword string

// Available storage methods: Database, LocalFile, S3

func LoadConfig() {

	// Redis connection
	DPRedisHost = os.Getenv("DP_REDIS_HOST")
	DPRedisPort = os.Getenv("DP_REDIS_PORT")
	DPRedisDB, _ = strconv.Atoi(os.Getenv("DP_REDIS_DB"))
	if DPRedisDB == 0 {
		DPRedisDB = 1
	}
	DPRedisPassword = os.Getenv("DP_REDIS_PASSWORD")

	// Clean tasks set

	CleanTasks, _ = strconv.Atoi(os.Getenv("DP_CLEANTASKS_DAYS"))
	if CleanTasks == 0 {
		CleanTasks = 30
	}

	CleanLogs, _ = strconv.Atoi(os.Getenv("DP_REMOVELOGS_DAYS"))
	if CleanLogs == 0 {
		CleanLogs = 30
	}

	Debug = os.Getenv("DP_DEBUG")
	if Debug == "" {
		Debug = "false"
	}

	SchedulerDebug = os.Getenv("DP_SCHEDULER_DEBUG")
	if SchedulerDebug == "" {
		SchedulerDebug = "false"
	}

	MQDebug = os.Getenv("DP_MQ_DEBUG")
	if MQDebug == "" {
		MQDebug = "false"
	}

	CodeDirectory = os.Getenv("DP_CODE_FOLDER")
	if CodeDirectory == "" {
		CodeDirectory = "/appdev/code-files/"
	}

	DPDatabase = os.Getenv("DP_DATABASE")

	/* --- CODE FILE FS ---- */
	FSCodeFileStorage = os.Getenv("DP_CODE_FILE_STORAGE")
	if FSCodeFileStorage == "" {
		FSCodeFileStorage = "Database"
	}

	FSCodeFileBatches, _ = strconv.Atoi(os.Getenv("DP_SYNC_FILE_BATCHES"))
	if FSCodeFileBatches == 0 {
		FSCodeFileBatches = 100
	}

	FSCodeDirectory = os.Getenv("DP_DFS_CODE_FOLDER")
	if FSCodeDirectory == "" {
		FSCodeDirectory = "/appdev/dfs-code-files/"
	}

}
