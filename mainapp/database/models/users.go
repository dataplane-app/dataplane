package models

import "time"

func (Users) IsEntity() {}

func (Users) TableName() string {
	return "users"
}

type Users struct {
	UserID    string     `gorm:"PRIMARY_KEY;type:varchar(48);" json:"user_id"`
	Username  string     `gorm:"type:varchar(255);index:idx_username,unique;" json:"username"`
	FirstName string     `json:"first_name"`
	LastName  string     `json:"last_name"`
	Email     string     `json:"email"`
	Password  string     `json:"password"`
	Timezone  string     `json:"timezone"`
	UserType  string     `json:"user_type"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt *time.Time `json:"updated_at"`
	DeletedAt *time.Time `json:"deleted_at,omitempty"`
}
