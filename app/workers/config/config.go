package config

import (
	"os"
	"strings"
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

// Debug
var Debug string = "false"

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

}
