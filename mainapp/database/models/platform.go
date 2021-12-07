package models

import "time"

func (Environment) IsEntity() {}

func (Environment) TableName() string {
	return "environment"
}

type Environment struct {
	ID        string     `gorm:"PRIMARY_KEY;type:varchar(48);" json:"id"`
	Name      string     `json:"name"`
	Active    bool       `json:"active"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt *time.Time `json:"updated_at"`
	DeletedAt *time.Time `json:"deleted_at,omitempty"`
}

func (Platform) IsEntity() {}

func (Platform) TableName() string {
	return "platform"
}

type Platform struct {
	ID           string     `gorm:"PRIMARY_KEY;type:varchar(48);" json:"id"`
	BusinessName string     `json:"business_name"`
	Timezone     string     `json:"timezone"`
	Complete     bool       `json:"complete"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    *time.Time `json:"updated_at"`
	DeletedAt    *time.Time `json:"deleted_at,omitempty"`
}
