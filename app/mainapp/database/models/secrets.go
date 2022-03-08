package models

import "time"

func (Secrets) IsEntity() {}

func (Secrets) TableName() string {
	return "secrets"
}

type Secrets struct {
	Secret        string     `gorm:"PRIMARY_KEY;type:varchar(255);" json:"secret"`
	EnvironmentID string     `gorm:"PRIMARY_KEY;type:varchar(64);" json:"environment_id"`
	SecretType    string     `json:"secret_type"` //environment || custom
	Value         string     `json:"value"`
	Description   string     `json:"description"`
	EnvVar        string     `json:"env_var"`
	Active        bool       `json:"active" validate:"required"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     *time.Time `json:"updated_at"`
	DeletedAt     *time.Time `json:"deleted_at,omitempty"`
}
