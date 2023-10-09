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
var AllowOrigins string = "*"
var Version string = "Development"

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

// Remote workers
var RemoteWorkerDebug string

// Database
var DPDBMaxOpenConns int
var DPDBMaxIdleConns int
var ConnMaxLifetime int

// Pipeline API input data
var DPDataInputTTLSeconds int
var DPDataInputLimitMegabyte int

// Available storage methods: Database, LocalFile, S3

func LoadConfig() {

	// Platform
	AllowOrigins = os.Getenv("DP_ALLOW_ORIGINS")

	// Database connection and defaults
	DPDBMaxOpenConns, _ = strconv.Atoi(os.Getenv("DP_DB_MAXOPENCONNS"))
	if DPDBMaxOpenConns == 0 {
		DPDBMaxOpenConns = 25
	}
	DPDBMaxIdleConns, _ = strconv.Atoi(os.Getenv("DP_DB_MAXIDLECONNS"))

	if DPDBMaxIdleConns == 0 {
		DPDBMaxIdleConns = 25
	}

	ConnMaxLifetime, _ = strconv.Atoi(os.Getenv("DP_DB_MAXLIFETIME"))
	/* default 5 minutes */
	if ConnMaxLifetime == 0 {
		ConnMaxLifetime = 5
	}

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

	RemoteWorkerDebug = os.Getenv("DP_REMOTEWORKER_DEBUG")
	if RemoteWorkerDebug == "" {
		RemoteWorkerDebug = "false"
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

	// Pipeline API input data

	// Default timeout is 24 hours = 24 x 60 x 60
	DPDataInputTTLSeconds, _ = strconv.Atoi(os.Getenv("DP_PIPELINE_DATA_TTL_SECONDS"))
	if DPDataInputTTLSeconds == 0 {
		DPDataInputTTLSeconds = 86400
	}

	// Default input data is 5 MB
	DPDataInputLimitMegabyte, _ = strconv.Atoi(os.Getenv("DP_PIPELINE_DATA_TTL_SECONDS"))
	if DPDataInputLimitMegabyte == 0 {
		DPDataInputLimitMegabyte = 5
	}
}
