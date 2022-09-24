package models

import (
	"time"

	"gorm.io/datatypes"
)

func (DeployPipelines) IsEntity() {}

func (DeployPipelines) TableName() string {
	return "deploy_pipelines"
}

type DeployPipelines struct {
	PipelineID        string         `gorm:"PRIMARY_KEY;type:varchar(64);" json:"pipeline_id"`
	Version           string         `gorm:"PRIMARY_KEY;type:varchar(64);" json:"version"`
	DeployActive      bool           `json:"deploy_active"`
	Name              string         `gorm:"type:varchar(255);" json:"name"`
	EnvironmentID     string         `gorm:"PRIMARY_KEY;" json:"environment_id"`
	FromEnvironmentID string         `json:"from_environment_id"`
	FromPipelineID    string         `json:"from_pipeline_id"`
	Description       string         `json:"description"`
	Active            bool           `json:"active"`
	WorkerGroup       string         `json:"worker_group"`
	Meta              datatypes.JSON `json:"meta"`
	Json              datatypes.JSON `json:"json"`
	UpdateLock        bool           `gorm:"default:false;" json:"update_lock"`
	CreatedAt         time.Time      `json:"created_at"`
	UpdatedAt         *time.Time     `json:"updated_at"`
	DeletedAt         *time.Time     `json:"deleted_at,omitempty"`
}

func (DeployPipelineNodes) IsEntity() {}

func (DeployPipelineNodes) TableName() string {
	return "deploy_pipeline_nodes"
}

type DeployPipelineNodes struct {
	NodeID        string         `gorm:"PRIMARY_KEY;type:varchar(128);" json:"node_id"`
	Version       string         `gorm:"PRIMARY_KEY;type:varchar(64);" json:"version"`
	PipelineID    string         `gorm:"PRIMARY_KEY;type:varchar(64);" json:"pipeline_id"`
	Name          string         `gorm:"type:varchar(255);" json:"name"`
	EnvironmentID string         `gorm:"PRIMARY_KEY;" json:"environment_id"`
	NodeType      string         `json:"node_type"`      //trigger, process, checkpoint
	NodeTypeDesc  string         `json:"node_type_desc"` //python, bash, play, scheduler, checkpoint, api
	TriggerOnline bool           `gorm:"default:false;" json:"trigger_online"`
	Description   string         `json:"description"`
	Commands      datatypes.JSON `json:"commands"`
	Meta          datatypes.JSON `json:"meta"`
	Dependency    datatypes.JSON `json:"dependency"`
	Destination   datatypes.JSON `json:"destination"`
	WorkerGroup   string         `gorm:"index:idx_dp_workergroup_nodes;" json:"worker_group"` //Inherits Pipeline workergroup unless specified
	Active        bool           `json:"active"`
	// FolderID       string         `json:"folder_id"`
	// ParentFolderID string         `json:"parent_folder_id"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt *time.Time `json:"updated_at"`
	DeletedAt *time.Time `json:"deleted_at,omitempty"`
}

func (DeployPipelineEdges) IsEntity() {}

func (DeployPipelineEdges) TableName() string {
	return "deploy_pipeline_edges"
}

type DeployPipelineEdges struct {
	EdgeID        string         `gorm:"PRIMARY_KEY;type:varchar(128);" json:"edge_id"`
	Version       string         `gorm:"PRIMARY_KEY;index:idx_deployid_nodes_edges;" json:"version"`
	PipelineID    string         `gorm:"index:idx_deployid_nodes_edges;" json:"pipeline_id"`
	From          string         `gorm:"index:idx_deployid_edge;" json:"from"`
	To            string         `gorm:"index:idx_deployid_edge;" json:"to"`
	EnvironmentID string         `gorm:"PRIMARY_KEY;" json:"environment_id"`
	Meta          datatypes.JSON `json:"meta"`
	Active        bool           `json:"active"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     *time.Time     `json:"updated_at"`
	DeletedAt     *time.Time     `json:"deleted_at,omitempty"`
}

func (DeployCodeFolders) IsEntity() {}

func (DeployCodeFolders) TableName() string {
	return "deploy_code_folders"
}

type DeployCodeFolders struct {
	FolderID      string     `gorm:"PRIMARY_KEY;type:varchar(24);" json:"folder_id"`
	Version       string     `gorm:"PRIMARY_KEY;type:varchar(64); index:idx_deployfolderunique,unique;" json:"version"`
	ParentID      string     `gorm:"type:varchar(24);" json:"parent_id"`
	EnvironmentID string     `gorm:"PRIMARY_KEY;type:varchar(55); index:idx_deployfolderunique,unique;" json:"environment_id"`
	PipelineID    string     `gorm:"type:varchar(55); index:idx_deployfolderunique,unique;" json:"pipeline_id"`
	NodeID        string     `gorm:"type:varchar(55); index:idx_deployfolderunique,unique;" json:"node_id"`
	FolderName    string     `gorm:"type:varchar(255);" json:"folder_name"`
	Level         string     `gorm:"index:idx_deployfolderunique,unique;" json:"level" ` //platform, environment, node, other
	FType         string     `json:"f_type"`                                             //folder, file, bin
	Active        bool       `json:"active"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     *time.Time `json:"updated_at"`
	DeletedAt     *time.Time `json:"deleted_at,omitempty"`
}

func (DeployCodeFiles) IsEntity() {}

func (DeployCodeFiles) TableName() string {
	return "deploy_code_files"
}

type DeployCodeFiles struct {
	FileID        string     `gorm:"PRIMARY_KEY;type:varchar(48);" json:"file_id"`
	Version       string     `gorm:"PRIMARY_KEY;type:varchar(64); index:idx_deployfileunique,unique;" json:"version"`
	FolderID      string     `gorm:"type:varchar(24); index:idx_deployfileunique,unique;" json:"folder_id"`
	EnvironmentID string     `gorm:"PRIMARY_KEY;type:varchar(55); index:idx_deployfileunique,unique;" json:"environment_id"`
	PipelineID    string     `gorm:"type:varchar(55); index:idx_deployfileunique,unique;" json:"pipeline_id"`
	NodeID        string     `gorm:"type:varchar(55); index:idx_deployfileunique,unique;" json:"node_id"`
	FileName      string     `gorm:"type:varchar(255); index:idx_deployfileunique,unique;" json:"file_name"`
	Level         string     `json:"level" ` //platform, environment, node, other
	FType         string     `json:"f_type"` //folder, file, bin
	Active        bool       `json:"active"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     *time.Time `json:"updated_at"`
	DeletedAt     *time.Time `json:"deleted_at,omitempty"`
}

func (DeployFilesStore) TableName() string {
	return "deploy_files_store"
}

type DeployFilesStore struct {
	FileID        string     `gorm:"PRIMARY_KEY;type:varchar(48);" json:"file_id"`
	Version       string     `gorm:"PRIMARY_KEY;type:varchar(64); json:"version"`
	FileStore     []byte     `gorm:"type:bytea; json:"file_store"`
	EnvironmentID string     `gorm:"type:varchar(55); json:"environment_id"`
	ChecksumMD5   string     `gorm:"type:varchar(55); json:"checksum_md5"`
	External      bool       `gorm:"default:False" json:"external"`
	RunInclude    bool       `gorm:"default:True" json:"run_include"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     *time.Time `json:"updated_at"`
	DeletedAt     *time.Time `json:"deleted_at,omitempty"`
}

func (DeployFolderDeleted) IsEntity() {}

func (DeployFolderDeleted) TableName() string {
	return "deploy_folder_deleted"
}

type DeployFolderDeleted struct {
	ID            string     `gorm:"PRIMARY_KEY;type:varchar(48);" json:"id"`
	Version       string     `gorm:"PRIMARY_KEY;type:varchar(64);" json:"version"`
	FileID        string     `gorm:"type:varchar(48);" json:"file_id"`
	FolderID      string     `gorm:"type:varchar(24);" json:"folder_id"`
	EnvironmentID string     `gorm:"PRIMARY_KEY;type:varchar(55); " json:"environment_id"`
	PipelineID    string     `gorm:"type:varchar(55);" json:"pipeline_id"`
	NodeID        string     `gorm:"type:varchar(55); " json:"node_id"`
	FileName      string     `gorm:"type:varchar(255); " json:"file_name"`
	FolderName    string     `gorm:"type:varchar(255);" json:"folder_name"`
	FType         string     `json:"f_type"` //folder, file, bin
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     *time.Time `json:"updated_at"`
	DeletedAt     *time.Time `json:"deleted_at,omitempty"`
}
