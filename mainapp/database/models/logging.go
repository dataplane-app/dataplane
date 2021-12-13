package models

import (
	"time"
)

func (LogsPlatform) IsEntity() {}

func (LogsPlatform) TableName() string {
	return "logs_platform"
}

type LogsPlatform struct {
	CreatedAt     time.Time `json:"created_at"`
	EnvironmentID string    `json:"environment_id"`
	Category      string    `json:"category"`
	Log           string    `json:"log"`
	LogType       string    `json:"log_type"` //info, error, debug
	ErrorMsg      string    `json:"error_message"`
}

func (LogsWeb) IsEntity() {}

func (LogsWeb) TableName() string {
	return "logging_web"
}

type LogsWeb struct {
	CreatedAt     time.Time `json:"created_at"`
	EnvironmentID string    `json:"environment_id"`
	Category      string    `json:"category"`
	Log           string    `json:"log"`
	LogType       string    `json:"log_type"`   //info, error, debug
	WebStatus     string    `json:"web_status"` //200, 500, 400
	Latency       string    `json:"latency"`
	Method        string    `json:"method"`
	Path          string    `json:"path"`
}
