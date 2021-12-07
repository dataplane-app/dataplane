package models

import "time"

func (Preferences) IsEntity() {}

func (Preferences) TableName() string {
	return "preferences"
}

type Preferences struct {
	UserID     string     `gorm:"PRIMARY_KEY;type:varchar(48);" json:"user_id"`
	Preference string     `json:"preference"`
	Value      string     `json:"value"`
	CreatedAt  time.Time  `json:"created_at"`
	UpdatedAt  *time.Time `json:"updated_at"`
	DeletedAt  *time.Time `json:"deleted_at,omitempty"`
}
