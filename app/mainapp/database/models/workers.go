package models

import "time"

func (Workers) IsEntity() {}

func (Workers) TableName() string {
	return "workers"
}

type Workers struct {
	WorkerID      string     `gorm:"PRIMARY_KEY;type:varchar(255);" json:"worker_id"`
	WorkerGroup   string     `gorm:"PRIMARY_KEY;" json:"worker_group"`
	EnvironmentID string     `gorm:"PRIMARY_KEY;" json:"environment_id"`
	Status        string     `json:"status"` //online || offline || failed || starting
	CPUPerc       float64    `json:"cpu_perc"`
	Load          float64    `json:"load"`
	MemoryPerc    float64    `json:"memory_perc"`
	MemoryUsed    float64    `json:"memory_used"`
	LB            string     `json:"lb"`
	WorkerType    string     `json:"worker_type"`
	UpdatedAt     *time.Time `json:"updated_at"`
}

func (WorkerGroups) IsEntity() {}

func (WorkerGroups) TableName() string {
	return "worker_groups"
}

type WorkerGroups struct {
	WorkerGroup   string     `gorm:"PRIMARY_KEY;type:varchar(255);" json:"worker_group"`
	EnvironmentID string     `gorm:"PRIMARY_KEY;type:varchar(255);" json:"environment_id"`
	LB            string     `json:"lb"`
	WorkerType    string     `json:"worker_type"`
	UpdatedAt     *time.Time `json:"updated_at"`
}

func (WorkerSecrets) IsEntity() {}

func (WorkerSecrets) TableName() string {
	return "worker_secrets"
}

type WorkerSecrets struct {
	SecretID      string `gorm:"PRIMARY_KEY;type:varchar(255);" json:"secret_id"`
	WorkerGroupID string `gorm:"PRIMARY_KEY;type:varchar(64);" json:"worker_group_id"`
	EnvironmentID string `gorm:"PRIMARY_KEY;type:varchar(64);" json:"environment_id"`
	Active        bool
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     *time.Time `json:"updated_at"`
	DeletedAt     *time.Time `json:"deleted_at,omitempty"`
}

type workerResponse struct {
	Response  string
	MainAppID string
}

type WorkerStats struct {
	WorkerGroup string
	WorkerID    string
	Status      string //Online, Busy
	CPUPerc     float64
	Load        float64
	MemoryPerc  float64
	MemoryUsed  float64
	EnvID       string `json:"EnvID"`
	LB          string `json:"LB"`
	WorkerType  string `json:"WorkerType"` //container, kubernetes
	T           time.Time
}

type WorkerGroup struct {
	WorkerGroup string
	Status      string //Online, Busy
	EnvID       string `json:"EnvID"`
	LB          string `json:"LB"`
	WorkerType  string `json:"WorkerType"` //container, kubernetes
}

func (RemoteProcessGroups) IsEntity() {}

func (RemoteProcessGroups) TableName() string {
	return "remote_process_groups"
}

type RemoteProcessGroups struct {
	ID          string     `gorm:"PRIMARY_KEY;type:varchar(255);" json:"id"`
	Name        string     `gorm:"type:varchar(255);" json:"name"`
	Description string     `json:"description"`
	Packages    string     `json:"packages"`
	Language    string     `gorm:"type:varchar(64);" json:"language"`
	LB          string     `json:"lb"`
	WorkerType  string     `json:"remote_process_type"`
	Active      bool       `json:"active"`
	UpdatedAt   *time.Time `json:"updated_at"`
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
	UpdatedAt   *time.Time `json:"updated_at"`
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
