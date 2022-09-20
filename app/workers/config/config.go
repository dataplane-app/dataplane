package wrkerconfig

import (
	"os"
	"strconv"
	"strings"

	"github.com/go-co-op/gocron"
)

var Secrets *strings.Replacer
var EnvName string
var EnvID string
var WorkerID string
var PlatformID string
var EncryptSecret string
var WorkerGroup string
var WorkerType string
var WorkerEnv string
var WorkerLB string
var DPworkerCMD string
var CodeDirectory string
var CodeLanguages string
var CodeLoadPackages string
var Scheduler *gocron.Scheduler

// Debug
var Debug string = "false"

// Distributed File storage
var FSCodeFileStorage string
var FSCodeFileBatches int
var FSCodeDirectory string

func LoadConfig() {

	Debug = os.Getenv("DP_DEBUG")
	if Debug == "" {
		Debug = "false"
	}

	EncryptSecret = os.Getenv("secret_encryption_key")

	WorkerGroup = os.Getenv("DP_WORKER_GROUP")
	WorkerType = os.Getenv("DP_WORKER_TYPE")
	WorkerEnv = os.Getenv("DP_WORKER_ENV")
	WorkerLB = os.Getenv("DP_WORKER_LB")
	if WorkerLB == "" {
		os.Setenv("DP_WORKER_LB", "roundrobin")
		WorkerLB = "roundrobin"
	}
	DPworkerCMD = os.Getenv("DP_WORKER_CMD")
	if DPworkerCMD == "" {
		DPworkerCMD = os.Getenv("SHELL")
	}

	CodeLanguages = os.Getenv("DP_WORKER_LANGUAGES")
	CodeLoadPackages = os.Getenv("DP_WORKER_LOAD_PACKAGES")
	if CodeLoadPackages == "" {
		CodeLoadPackages = "false"
	}

	CodeDirectory = os.Getenv("DP_CODE_FOLDER")
	if CodeDirectory == "" {
		CodeDirectory = "/appdev/code-files/"
	}

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
