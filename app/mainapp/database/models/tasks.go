package models

import "time"

func (WorkerTasks) IsEntity() {}

func (WorkerTasks) TableName() string {
	return "worker_tasks"
}

type WorkerTasks struct {
	TaskID        string    `gorm:"PRIMARY_KEY;type:varchar(48);" json:"task_id"`
	CreatedAt     time.Time `json:"created_at"`
	EnvironmentID string    `json:"environment_id"`
	RunID         string    `json:"run_id"`
	WorkerGroup   string    `json:"worker_group"`
	WorkerID      string    `json:"worker_id"`
	StartDT       time.Time `json:"start_dt"`
	EndDT         time.Time `json:"end_dt"`
	Status        string    `json:"status"`
	Reason        string    `json:"reason"`
}

type WorkerTaskSend struct {
	TaskID        string    `json:"task_id"`
	CreatedAt     time.Time `json:"created_at"`
	EnvironmentID string    `json:"environment_id"`
	RunID         string    `json:"run_id"`
	WorkerGroup   string    `json:"worker_group"`
	WorkerID      string    `json:"worker_id"`
	Commands      []string  `json:"commands"`
}
