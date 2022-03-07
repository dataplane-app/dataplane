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

	if os.Getenv("debug") != "true" {
		Debug = os.Getenv("debug")
	}

	if os.Getenv("secret_encryption_key") != "" {
		EncryptSecret = os.Getenv("secret_encryption_key")
	}

	WorkerGroup = os.Getenv("worker_group")

}
