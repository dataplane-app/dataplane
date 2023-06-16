package models

import (
	"time"

	"gorm.io/datatypes"
)

type TaskResponse struct {
	R string
	M string
}

func (WorkerTasks) IsEntity() {}

func (WorkerTasks) TableName() string {
	return "worker_tasks"
}

type WorkerTasks struct {
	TaskID        string         `gorm:"PRIMARY_KEY;type:varchar(48);" json:"task_id"`
	CreatedAt     time.Time      `json:"created_at"`
	EnvironmentID string         `json:"environment_id"`
	RunID         string         `gorm:"index:idx_task_runid;index:idx_task_nodeid;" json:"run_id"`
	RunType       string         `json:"run_type"`
	WorkerGroup   string         `json:"worker_group"`
	WorkerID      string         `json:"worker_id"`
	WorkerType    string         `json:"worker_type"`
	PipelineID    string         `json:"pipeline_id"`
	NodeID        string         `gorm:"index:idx_task_nodeid;" json:"node_id"`
	Folder        string         `json:"folder"`
	FolderID      string         `json:"folder_id"`
	Dependency    datatypes.JSON `json:"dependency"`
	Destination   datatypes.JSON `json:"destination"`
	StartDT       time.Time      `json:"start_dt"`
	EndDT         time.Time      `json:"end_dt"`
	Status        string         `json:"status"`
	Reason        string         `json:"reason"`
	Commands      datatypes.JSON `json:"commands"`
	Version       string         `json:"version"`
}

func (WorkerTaskLock) IsEntity() {}

func (WorkerTaskLock) TableName() string {
	return "worker_task_lock"
}

type WorkerTaskLock struct {
	RunID     string    `gorm:"PRIMARY_KEY;type:varchar(48);" json:"run_id"`
	NodeID    string    `gorm:"PRIMARY_KEY;type:varchar(48);" json:"node_id"`
	CreatedAt time.Time `json:"created_at"`
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
	Folder        string    `json:"folder"`
	FolderID      string    `json:"folder_id"`
	Commands      []string  `json:"commands"`
	Version       string    `json:"version"`
	RunType       string    `json:"run_type"`
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
