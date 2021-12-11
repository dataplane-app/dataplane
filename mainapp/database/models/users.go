package models

import "time"

func (Users) IsEntity() {}

func (Users) TableName() string {
	return "users"
}

type Users struct {
	UserID    string     `gorm:"PRIMARY_KEY;type:varchar(48);" json:"user_id"`
	Username  string     `gorm:"type:varchar(255);index:idx_username,unique;" json:"username"`
	FirstName string     `json:"first_name" validate:"required"`
	LastName  string     `json:"last_name" validate:"required"`
	Email     string     `json:"email" validate:"required,email"`
	JobTitle  string     `json:"job_title" validate:"required"`
	Password  string     `json:"password" validate:"required,min=5"`
	Timezone  string     `json:"timezone" validate:"required"`
	UserType  string     `json:"user_type"`
	Status    string     `json:"status"` // Can only be active, inactive, register
	Active    bool       `json:"active"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt *time.Time `json:"updated_at"`
	DeletedAt *time.Time `json:"deleted_at,omitempty"`
}
