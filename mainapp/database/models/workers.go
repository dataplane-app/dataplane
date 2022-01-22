package models

import "time"

func (Workers) IsEntity() {}

func (Workers) TableName() string {
	return "workers"
}

type Workers struct {
	WorkerID       string     `gorm:"PRIMARY_KEY;type:varchar(255);" json:"worker_id"`
	CPU            int        `json:"cpu"`
	Memory         int        `json:"memory"`
	NetworkAddress string     `json:"network_address"`
	NetworkPort    string     `json:"network_port"`
	WorkerGroup    string     `json:"worker_group"`
	AcceptStatus   string     `json:"accept_status"`
	Status         string     `json:"status"` //online || offline || failed || starting
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      *time.Time `json:"updated_at"`
	DeletedAt      *time.Time `json:"deleted_at,omitempty"`
}

func (WorkerGroups) IsEntity() {}

func (WorkerGroups) TableName() string {
	return "worker_groups"
}

type WorkerGroups struct {
	WorkerGroupID string     `gorm:"PRIMARY_KEY;type:varchar(255);" json:"worker_group_id"`
	WorkerName    string     `json:"worker_name"`
	WorkerType    string     `json:"secret_type"` //docker || kubernetes
	Description   string     `json:"description"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     *time.Time `json:"updated_at"`
	DeletedAt     *time.Time `json:"deleted_at,omitempty"`
}

func (WorkerSecrets) IsEntity() {}

func (WorkerSecrets) TableName() string {
	return "worker_secrets"
}

type WorkerSecrets struct {
	SecretID      string `gorm:"PRIMARY_KEY;type:varchar(255);" json:"secret_id"`
	WorkerGroupID string `gorm:"PRIMARY_KEY;type:varchar(255);" json:"worker_group_id"`
	Active        bool
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     *time.Time `json:"updated_at"`
	DeletedAt     *time.Time `json:"deleted_at,omitempty"`
}
