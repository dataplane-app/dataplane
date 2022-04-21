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
	EnvironmentID string     `gorm:"type:varchar(55); index:idx_pipelinesmodel; index:idx_folderunique,unique;" json:"environment_id"`
	PipelineID    string     `gorm:"type:varchar(55); index:idx_pipelinesmodel; index:idx_folderunique,unique;" json:"pipeline_id"`
	NodeID        string     `gorm:"type:varchar(55); index:idx_pipelinesmodel; index:idx_folderunique,unique;" json:"node_id"`
	FolderName    string     `gorm:"type:varchar(255);" json:"folder_name"`
	Level         string     `gorm:"index:idx_folderunique,unique;" json:"level" ` //platform, environment, node, other
	FType         string     `json:"f_type"`                                       //folder, file, bin
	Active        bool       `json:"active"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     *time.Time `json:"updated_at"`
	DeletedAt     *time.Time `json:"deleted_at,omitempty"`
}

func (CodeFiles) IsEntity() {}

func (CodeFiles) TableName() string {
	return "code_files"
}

type CodeFiles struct {
	FileID        string     `gorm:"PRIMARY_KEY;type:varchar(48);" json:"file_id"`
	FolderID      string     `gorm:"type:varchar(24); index:idx_fileunique,unique;" json:"folder_id"`
	EnvironmentID string     `gorm:"type:varchar(55); index:idx_fileunique,unique;" json:"environment_id"`
	PipelineID    string     `gorm:"type:varchar(55);" json:"pipeline_id"`
	NodeID        string     `gorm:"type:varchar(55); index:idx_fileunique,unique;" json:"node_id"`
	FileName      string     `gorm:"type:varchar(255); index:idx_fileunique,unique;" json:"file_name"`
	Level         string     `json:"level" ` //platform, environment, node, other
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

func (FolderDeleted) IsEntity() {}

func (FolderDeleted) TableName() string {
	return "folder_deleted"
}

type FolderDeleted struct {
	ID            string     `gorm:"PRIMARY_KEY;type:varchar(48);" json:"id"`
	FileID        string     `gorm:"type:varchar(48);" json:"file_id"`
	FolderID      string     `gorm:"type:varchar(24);" json:"folder_id"`
	EnvironmentID string     `gorm:"type:varchar(55); " json:"environment_id"`
	PipelineID    string     `gorm:"type:varchar(55);" json:"pipeline_id"`
	NodeID        string     `gorm:"type:varchar(55); " json:"node_id"`
	FileName      string     `gorm:"type:varchar(255); " json:"file_name"`
	FolderName    string     `gorm:"type:varchar(255);" json:"folder_name"`
	FType         string     `json:"f_type"` //folder, file, bin
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     *time.Time `json:"updated_at"`
	DeletedAt     *time.Time `json:"deleted_at,omitempty"`
}

type FolderDuplicate struct {
	FolderID string `json:"folder_id"`
	OldDir   string `json:"old_dir"`
	NewDir   string `json:"new_dir"`
}

type FileDuplicate struct {
	FileID string `json:"file_id"`
	OldDir string `json:"old_dir"`
	NewDir string `json:"new_dir"`
}
