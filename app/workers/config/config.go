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

// Debug
var Debug string = "false"

func LoadConfig() {

	Debug = os.Getenv("debug")
	if Debug == "" {
		Debug = "false"
	}

	EncryptSecret = os.Getenv("secret_encryption_key")

	WorkerGroup = os.Getenv("worker_group")

}
