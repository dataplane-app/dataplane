package models

import (
	"time"

	"gorm.io/datatypes"
)

func (Pipelines) IsEntity() {}

func (Pipelines) TableName() string {
	return "pipelines"
}

type Pipelines struct {
	PipelineID string `gorm:"PRIMARY_KEY;type:varchar(64);" json:"pipeline_id"`
	Name       string `gorm:"type:varchar(255);" json:"name"`
	// Version       string         `gorm:"type:varchar(125);index:idx_pipelines,unique;" json:"version"`
	EnvironmentID string `json:"environment_id"`
	// YAMLHash      string         `json:"yaml_hash"`
	Description string         `json:"description"`
	Active      bool           `json:"active"`
	WorkerGroup string         `json:"worker_group"`
	Meta        datatypes.JSON `json:"meta"`
	Json        datatypes.JSON `json:"json"`
	UpdateLock  bool           `gorm:"default:false;" json:"update_lock"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   *time.Time     `json:"updated_at"`
	DeletedAt   *time.Time     `json:"deleted_at,omitempty"`
}

func (PipelineNodes) IsEntity() {}

func (PipelineNodes) TableName() string {
	return "pipeline_nodes"
}

type PipelineNodes struct {
	NodeID        string         `gorm:"PRIMARY_KEY;type:varchar(128);" json:"node_id"`
	PipelineID    string         `gorm:"index:idx_pipelineid_nodes;" json:"pipeline_id"`
	Name          string         `gorm:"type:varchar(255);" json:"name"`
	EnvironmentID string         `json:"environment_id"`
	NodeType      string         `json:"node_type"`      //trigger, process, checkpoint
	NodeTypeDesc  string         `json:"node_type_desc"` //python, bash, play, scheduler, checkpoint, api
	Description   string         `json:"description"`
	Commands      datatypes.JSON `json:"commands"`
	Meta          datatypes.JSON `json:"meta"`
	Dependency    datatypes.JSON `json:"dependency"`
	Destination   datatypes.JSON `json:"destination"`
	WorkerGroup   string         `json:"worker_group"` //Inherits Pipeline workergroup unless specified
	Active        bool           `json:"active"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     *time.Time     `json:"updated_at"`
	DeletedAt     *time.Time     `json:"deleted_at,omitempty"`
}

func (PipelineEdges) IsEntity() {}

func (PipelineEdges) TableName() string {
	return "pipeline_edges"
}

type PipelineEdges struct {
	EdgeID        string         `gorm:"PRIMARY_KEY;type:varchar(128);" json:"edge_id"`
	PipelineID    string         `gorm:"index:idx_pipelineid_nodes_edges;" json:"pipeline_id"`
	From          string         `gorm:"index:idx_pipelineid_edge;" json:"from"`
	To            string         `gorm:"index:idx_pipelineid_edge;" json:"to"`
	EnvironmentID string         `json:"environment_id"`
	Meta          datatypes.JSON `json:"meta"`
	Active        bool           `json:"active"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     *time.Time     `json:"updated_at"`
	DeletedAt     *time.Time     `json:"deleted_at,omitempty"`
}

func (PipelineRuns) IsEntity() {}

func (PipelineRuns) TableName() string {
	return "pipeline_runs"
}

type PipelineRuns struct {
	RunID         string         `gorm:"PRIMARY_KEY;type:varchar(64);" json:"run_id"`
	PipelineID    string         `gorm:"index:idx_pipelineid_runs;" json:"pipeline_id"`
	Status        string         `json:"status"`
	Reason        string         `json:"reason"`
	EnvironmentID string         `json:"environment_id"`
	RunJSON       datatypes.JSON `json:"run_json"`
	CreatedAt     time.Time      `json:"created_at"`
	EndedAt       time.Time      `json:"ended_at"`
	UpdatedAt     *time.Time     `json:"updated_at"`
}

// func (PipelinesArchive) IsEntity() {}

// func (PipelinesArchive) TableName() string {
// 	return "pipelines_archive"
// }

// type PipelinesArchive struct {
// 	PipelineID  string         `gorm:"PRIMARY_KEY;type:varchar(64);" json:"pipeline_id"`
// 	Name        string         `gorm:"type:varchar(255);index:idx_pipelines_history,unique;" json:"name"`
// 	Version     string         `gorm:"type:varchar(125);index:idx_pipelines_history,unique;" json:"version"`
// 	YAMLHash    string         `json:"yaml_hash"`
// 	Description string         `json:"description"`
// 	Active      bool           `json:"active"`
// 	Online      bool           `json:"online"`
// 	Current     string         `json:"current"`
// 	FileJSON    datatypes.JSON `json:"file_json"`
// 	CreatedAt   time.Time      `json:"created_at"`
// 	UpdatedAt   *time.Time     `json:"updated_at"`
// 	DeletedAt   *time.Time     `json:"deleted_at,omitempty"`
// }
