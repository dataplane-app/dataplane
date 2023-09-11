package models

import (
	"time"
)

func (DatabaseMigrations) IsEntity() {}

func (DatabaseMigrations) TableName() string {
	return "database_migrations"
}

type DatabaseMigrations struct {
	MigrationKey     string     `gorm:"PRIMARY_KEY;type:varchar(64);" json:"migration_key"`
	MigrationVersion string     `gorm:"type:varchar(64);" json:"migration_version"`
	Completed        bool       `json:"completed"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        *time.Time `json:"updated_at"`
	DeletedAt        *time.Time `json:"deleted_at,omitempty"`
}
