package models

import "time"

func (AuthRefreshTokens) IsEntity() {}

func (AuthRefreshTokens) TableName() string {
	return "auth_refresh_tokens"
}

type AuthRefreshTokens struct {
	UserID       string    `gorm:"PRIMARY_KEY;" json:"user_id"`
	RefreshToken string    `gorm:"PRIMARY_KEY;" json:"refresh_token"`
	Expires      time.Time `gorm:"index:idx_refreshtoken_expire;" json:"expires"`
	CreatedAt    time.Time `json:"created_at"`
}
