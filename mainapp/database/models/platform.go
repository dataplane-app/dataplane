package models

import "time"

func (Environment) IsEntity() {}

func (Environment) TableName() string {
	return "environment"
}

type Environment struct {
	ID        string     `gorm:"PRIMARY_KEY;type:varchar(48);" json:"id"`
	Name      string     `json:"platform"`
	Active    bool       `json:"active"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt *time.Time `json:"updated_at"`
	DeletedAt *time.Time `json:"deleted_at,omitempty"`
}
