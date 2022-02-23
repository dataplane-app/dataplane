package models

import (
	"time"

	"gorm.io/datatypes"
)

func (WorkerTasks) IsEntity() {}

func (WorkerTasks) TableName() string {
	return "worker_tasks"
}

type WorkerTasks struct {
	TaskID        string         `gorm:"PRIMARY_KEY;type:varchar(48);" json:"task_id"`
	CreatedAt     time.Time      `json:"created_at"`
	EnvironmentID string         `json:"environment_id"`
	RunID         string         `gorm:"index:idx_task_runid;index:idx_task_nodeid;" json:"run_id"`
	WorkerGroup   string         `json:"worker_group"`
	WorkerID      string         `json:"worker_id"`
	PipelineID    string         `json:"pipeline_id"`
	NodeID        string         `gorm:"index:idx_task_nodeid;" json:"node_id"`
	Dependency    datatypes.JSON `json:"dependency"`
	Destination   datatypes.JSON `json:"destination"`
	StartDT       time.Time      `json:"start_dt"`
	EndDT         time.Time      `json:"end_dt"`
	Status        string         `json:"status"`
	Reason        string         `json:"reason"`
}

type WorkerTaskSend struct {
	TaskID        string    `json:"task_id"`
	CreatedAt     time.Time `json:"created_at"`
	EnvironmentID string    `json:"environment_id"`
	PipelineID    string    `json:"pipeline_id"`
	NodeID        string    `json:"node_id"`
	RunID         string    `json:"run_id"`
	WorkerGroup   string    `json:"worker_group"`
	WorkerID      string    `json:"worker_id"`
	Commands      []string  `json:"commands"`
}

type WorkerPipelineNext struct {
	TaskID        string    `json:"task_id"`
	CreatedAt     time.Time `json:"created_at"`
	EnvironmentID string    `json:"environment_id"`
	PipelineID    string    `json:"pipeline_id"`
	RunID         string    `json:"run_id"`
	NodeID        string    `json:"node_id"`
	Status        string    `json:"status"`
}
