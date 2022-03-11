package models

import "time"

func (Scheduler) IsEntity() {}

func (Scheduler) TableName() string {
	return "scheduler"
}

type Scheduler struct {
	NodeID        string     `gorm:"primaryKey;" json:"node_id"`
	PipelineID    string     `json:"pipeline_id"`
	EnvironmentID string     `json:"environment_id"`
	ScheduleType  string     `json:"schedule_type"`
	Schedule      string     `json:"schedule"`
	Timezone      string     `json:"timezone"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     *time.Time `json:"updated_at"`
}

func (SchedulerLock) IsEntity() {}

func (SchedulerLock) TableName() string {
	return "scheduler_lock"
}

type SchedulerLock struct {
	NodeID        string    `gorm:"primaryKey;" json:"node_id"`
	EnvironmentID string    `json:"environment_id"`
	LockLease     time.Time `json:"lock_lease"`
}
