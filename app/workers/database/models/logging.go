package models

import (
	"time"
)

func (LogsWorkers) IsEntity() {}

func (LogsWorkers) TableName() string {
	return "logs_workers"
}

type LogsWorkers struct {
	CreatedAt     time.Time `json:"created_at"`
	EnvironmentID string    `json:"environment_id"`
	Category      string    `json:"category"`
	RunID         string    `json:"run_id"`
	TaskID        string    `gorm:"index:idx_logtasks;type:varchar(64);" json:"task_id"`
	Log           string    `json:"log"`
	LogType       string    `json:"log_type"` //info, error, debug
	ErrorMsg      string    `json:"error_message"`
}
