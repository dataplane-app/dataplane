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

// Debug
var Debug string = "false"

func LoadConfig() {

	if os.Getenv("debug") != "true" {
		Debug = os.Getenv("debug")
	}

}
