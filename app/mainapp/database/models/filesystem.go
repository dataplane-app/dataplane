package models

import (
	"time"
)

func (CodeFolders) IsEntity() {}

func (CodeFolders) TableName() string {
	return "code_folders"
}

type CodeFolders struct {
	FolderID      string     `gorm:"PRIMARY_KEY;size:55;" json:"folder_id"`
	ParentID      string     `gorm:"type:varchar(55);" json:"parent_id"`
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
	FileID        string     `gorm:"PRIMARY_KEY;size:55;" json:"file_id"`
	FolderID      string     `gorm:"size:55;index:idx_fileunique,unique;" json:"folder_id"`
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

func (CodeFilesStore) TableName() string {
	return "code_files_store"
}

type CodeFilesStore struct {
	FileID        string     `gorm:"PRIMARY_KEY;type:varchar(48);" json:"file_id"`
	FileStore     []byte     `gorm:"type:bytea;" json:"file_store"`
	EnvironmentID string     `gorm:"type:varchar(55);" json:"environment_id"`
	ChecksumMD5   string     `gorm:"type:varchar(55);" json:"checksum_md5"`
	External      bool       `gorm:"default:False" json:"external"`
	RunInclude    bool       `gorm:"default:True" json:"run_include"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     *time.Time `json:"updated_at"`
	DeletedAt     *time.Time `json:"deleted_at,omitempty"`
}

func (CodeGitCommits) IsEntity() {}

func (CodeGitCommits) TableName() string {
	return "code_git_commits"
}

type CodeGitCommits struct {
	GitID      string     `gorm:"PRIMARY_KEY;type:varchar(55);" json:"git_id"`
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
	FolderID      string     `gorm:"size:55;" json:"folder_id"`
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

func (CodeFilesCache) IsEntity() {}

func (CodeFilesCache) TableName() string {
	return "code_files_cache"
}

type CodeFilesCache struct {
	FileID           string     `gorm:"primaryKey;type:varchar(48);" json:"file_id"`
	NodeID           string     `gorm:"primaryKey;type:varchar(48);" json:"node_id"`
	WorkerID         string     `gorm:"primaryKey;type:varchar(48);" json:"worker_id"`
	WorkerGroup      string     `json:"worker_group"`
	EnvironmentID    string     `gorm:"type:varchar(55);" json:"environment_id"`
	ChecksumMD5Check bool       `gorm:"default:false;" json:"checksum_md5_check"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        *time.Time `json:"updated_at"`
}

func (CodeNodeCache) IsEntity() {}

func (CodeNodeCache) TableName() string {
	return "code_node_cache"
}

type CodeNodeCache struct {
	WorkerID      string     `gorm:"primaryKey;type:varchar(48);" json:"worker_id"`
	NodeID        string     `gorm:"primaryKey;type:varchar(48);" json:"node_id"`
	WorkerGroup   string     `json:"worker_group"`
	EnvironmentID string     `gorm:"type:varchar(55);" json:"environment_id"`
	CacheValid    bool       `gorm:"default:false;" json:"cache_valid"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     *time.Time `json:"updated_at"`
}

/* Output from cache to download files */
type CodeFilesCacheOutput struct {
	FileID      string `json:"file_id"`
	FolderID    string `json:"folder_id"`
	FileName    string `json:"file_name"`
	ChecksumMD5 string `json:"checksum_md5"`
	FileStore   []byte `gorm:"type:bytea;" json:"file_store"`
}

func (DeployCodeFilesCache) IsEntity() {}

func (DeployCodeFilesCache) TableName() string {
	return "deploy_code_files_cache"
}

type DeployCodeFilesCache struct {
	FileID           string     `gorm:"primaryKey;type:varchar(48);" json:"file_id"`
	NodeID           string     `gorm:"primaryKey;type:varchar(48);" json:"node_id"`
	Version          string     `gorm:"primaryKey;type:varchar(48);" json:"version"`
	WorkerID         string     `gorm:"primaryKey;type:varchar(48);" json:"worker_id"`
	WorkerGroup      string     `json:"worker_group"`
	EnvironmentID    string     `gorm:"type:varchar(55);" json:"environment_id"`
	ChecksumMD5Check bool       `gorm:"default:false;" json:"checksum_md5_check"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        *time.Time `json:"updated_at"`
}

func (DeployCodeNodeCache) IsEntity() {}

func (DeployCodeNodeCache) TableName() string {
	return "deploy_code_node_cache"
}

type DeployCodeNodeCache struct {
	WorkerID      string     `gorm:"primaryKey;type:varchar(48);" json:"worker_id"`
	NodeID        string     `gorm:"primaryKey;type:varchar(48);" json:"node_id"`
	Version       string     `gorm:"primaryKey;type:varchar(48);" json:"version"`
	WorkerGroup   string     `json:"worker_group"`
	EnvironmentID string     `gorm:"type:varchar(55);" json:"environment_id"`
	CacheValid    bool       `gorm:"default:false;" json:"cache_valid"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     *time.Time `json:"updated_at"`
}

// func (Test) IsEntity() {}

// func (Test) TableName() string {
// 	return "test"
// }

// type Test struct {
// 	Size string `gorm:"primaryKey;size:55;" json:"size"`
// 	Me   string `gorm:"size:65;" json:"me"`
// }
