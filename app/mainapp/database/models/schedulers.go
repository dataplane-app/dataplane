package models

import "time"

func (Scheduler) IsEntity() {}

func (Scheduler) TableName() string {
	return "scheduler"
}

type Scheduler struct {
	ID            uint       `gorm:"primaryKey;autoIncrement;" json:"id"`
	PipelineID    string     `json:"pipeline_id"`
	NodeID        string     `json:"node_id"`
	EnvironmentID string     `json:"environment_id"`
	ScheduleType  string     `json:"schedule_type"`
	Schedule      string     `json:"schedule"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     *time.Time `json:"updated_at"`
}
