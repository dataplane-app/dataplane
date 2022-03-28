package models

import (
	"time"

	"gorm.io/datatypes"
)

func (CodeRun) IsEntity() {}

func (CodeRun) TableName() string {
	return "code_run"
}

type CodeRun struct {
	RunID         string         `gorm:"PRIMARY_KEY;type:varchar(64);" json:"run_id"`
	NodeID        string         `json:"node_id"`
	FileID        string         `json:"file_id"`
	Status        string         `json:"status"`
	Reason        string         `json:"reason"`
	EnvironmentID string         `json:"environment_id"`
	WorkerGroup   string         `json:"worker_group"`
	WorkerID      string         `json:"worker_id"`
	FolderID      string         `json:"folder_id"`
	Folder        string         `json:"folder"`
	Commands      datatypes.JSON `json:"commands"`
	RunJSON       datatypes.JSON `json:"run_json"`
	CreatedAt     time.Time      `json:"created_at"`
	EndedAt       time.Time      `json:"ended_at"`
	UpdatedAt     *time.Time     `json:"updated_at"`
}

func (CodeRunLock) IsEntity() {}

func (CodeRunLock) TableName() string {
	return "code_run_lock"
}

type CodeRunLock struct {
	RunID     string    `gorm:"PRIMARY_KEY;type:varchar(48);" json:"run_id"`
	FileID    string    `gorm:"PRIMARY_KEY;type:varchar(48);" json:"file_id"`
	CreatedAt time.Time `json:"created_at"`
}
