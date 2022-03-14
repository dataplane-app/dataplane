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

// Debug
var Debug string = "false"

func LoadConfig() {

	Debug = os.Getenv("debug")
	if Debug == "" {
		Debug = "false"
	}

	EncryptSecret = os.Getenv("secret_encryption_key")

	WorkerGroup = os.Getenv("worker_group")
	WorkerType = os.Getenv("worker_type")
	WorkerEnv = os.Getenv("worker_env")
	WorkerLB = os.Getenv("worker_lb")
	if WorkerLB == "" {
		os.Setenv("worker_lb", "roundrobin")
		WorkerLB = "roundrobin"
	}
	DPworkerCMD = os.Getenv("DP_WORKER_CMD")
	if DPworkerCMD == "" {
		DPworkerCMD = os.Getenv("SHELL")
	}

}

// if os.Getenv("worker_type") == "" {
// 	panic("Requires worker_type environment variable")
// }

// if os.Getenv("worker_env") == "" {
// 	panic("Requires worker_env environment variable")
// }

// if os.Getenv("worker_lb") == "" {
// 	os.Setenv("worker_lb", "roundrobin")
// }
