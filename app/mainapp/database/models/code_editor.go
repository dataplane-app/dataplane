package models

import (
	"time"
)

func (CodeFolders) IsEntity() {}

func (CodeFolders) TableName() string {
	return "code_folders"
}

type CodeFolders struct {
	FolderID      string     `gorm:"PRIMARY_KEY;type:varchar(24);" json:"folder_id"`
	ParentID      string     `gorm:"type:varchar(24);" json:"parent_id"`
	EnvironmentID string     `gorm:"type:varchar(55); index:idx_pipelinesmodel;" json:"environment_id"`
	PipelineID    string     `gorm:"type:varchar(55); index:idx_pipelinesmodel;" json:"pipeline_id"`
	NodeID        string     `gorm:"type:varchar(55); index:idx_pipelinesmodel;" json:"parent_id"`
	FolderName    string     `gorm:"type:varchar(255);" json:"folder_name"`
	Level         string     `json:"level"`  //platform, environment, node, other
	FType         string     `json:"f_type"` //folder, file, bin
	Active        bool       `json:"active"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     *time.Time `json:"updated_at"`
	DeletedAt     *time.Time `json:"deleted_at,omitempty"`
}

func (CodeGitCommits) IsEntity() {}

func (CodeGitCommits) TableName() string {
	return "code_git_commits"
}

type CodeGitCommits struct {
	GitID      string     `gorm:"PRIMARY_KEY;type:varchar(24);" json:"git_id"`
	PipelineID string     `gorm:"PRIMARY_KEY;" json:"pipeline_id"`
	CreatedAt  time.Time  `json:"created_at"`
	UpdatedAt  *time.Time `json:"updated_at"`
	DeletedAt  *time.Time `json:"deleted_at,omitempty"`
}
