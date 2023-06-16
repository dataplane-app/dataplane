package models

import "time"

/* This is a joined process group per environment per worker */
type RemotePGOutput struct {
	WorkerID             string `gorm:"PRIMARY_KEY;type:varchar(64);" json:"worker_id"`
	RemoteProcessGroupID string `gorm:"PRIMARY_KEY;type:varchar(64);" json:"remote_process_group_id"`
	EnvironmentID        string `gorm:"PRIMARY_KEY;type:varchar(64);" json:"environment_id"`
	Name                 string `gorm:"type:varchar(255);" json:"name"`
	Packages             string `json:"packages"`
	Language             string `gorm:"type:varchar(64);" json:"language"`
}

func (RemoteProcessGroups) IsEntity() {}

func (RemoteProcessGroups) TableName() string {
	return "remote_process_groups"
}

type RemoteProcessGroups struct {
	RemoteProcessGroupID string     `gorm:"PRIMARY_KEY;type:varchar(255);" json:"remote_process_group_id"`
	Name                 string     `gorm:"type:varchar(255);" json:"name"`
	Description          string     `json:"description"`
	Packages             string     `json:"packages"`
	Language             string     `gorm:"type:varchar(64);" json:"language"`
	LB                   string     `json:"lb"`
	WorkerType           string     `json:"remote_process_type"`
	Active               bool       `json:"active"`
	CreatedAt            time.Time  `json:"created_at"`
	UpdatedAt            *time.Time `json:"updated_at"`
	DeletedAt            *time.Time `json:"deleted_at,omitempty"`
}

func (RemoteWorkerEnvironments) IsEntity() {}

func (RemoteWorkerEnvironments) TableName() string {
	return "remote_worker_environments"
}

type RemoteWorkerEnvironments struct {
	WorkerID             string     `gorm:"PRIMARY_KEY;type:varchar(64);" json:"worker_id"`
	RemoteProcessGroupID string     `gorm:"PRIMARY_KEY;type:varchar(64);" json:"remote_process_group_id"`
	EnvironmentID        string     `gorm:"PRIMARY_KEY;type:varchar(64);" json:"environment_id"`
	CreatedAt            time.Time  `json:"created_at"`
	UpdatedAt            *time.Time `json:"updated_at"`
	DeletedAt            *time.Time `json:"deleted_at,omitempty"`
}

func (RemoteWorkers) IsEntity() {}

func (RemoteWorkers) TableName() string {
	return "remote_workers"
}

type RemoteWorkers struct {
	WorkerID    string     `gorm:"PRIMARY_KEY;type:varchar(64);" json:"worker_id"`
	WorkerName  string     `json:"worker_name"`
	Description string     `json:"description"`
	Status      string     `json:"status"` //online || offline || failed || starting
	Active      bool       `json:"active"`
	LB          string     `json:"lb"`
	WorkerType  string     `json:"worker_type"`
	LastPing    *time.Time `json:"last_ping"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   *time.Time `json:"updated_at"`
	DeletedAt   *time.Time `json:"deleted_at,omitempty"`
}

func (RemoteWorkerActivationKeys) IsEntity() {}

func (RemoteWorkerActivationKeys) TableName() string {
	return "remote_worker_activation_keys"
}

type RemoteWorkerActivationKeys struct {
	ActivationKey     string     `gorm:"PRIMARY_KEY;type:varchar(64);" json:"activation_key"`
	ActivationKeyTail string     `json:"activation_key_tail"`
	RemoteWorkerID    string     `json:"remote_worker_id"`
	ExpiresAt         *time.Time `json:"expires_at"`
	CreatedAt         time.Time  `json:"created_at"`
	DeletedAt         *time.Time `json:"deleted_at,omitempty"`
}
