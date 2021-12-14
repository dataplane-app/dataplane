// https://github.com/version-1/gin-gorm-gqlgen-sample/blob/master/src/gin_graphql/resolver.go

package models

import (
	"time"

	"gorm.io/datatypes"
)

func (Workers) IsEntity() {}

func (Workers) TableName() string {
	return "workers"
}

type Workers struct {
	Name        string         `gorm:"PRIMARY_KEY;type:varchar(10);" json:"name"`
	CPU         int            `json:"cpu"`
	Memory      int            `json:"memory"`
	ThreadCount int            `json:"threadcount"`
	MyDate      datatypes.Date `json:"my_date"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   *time.Time     `json:"updated_at"`
	DeletedAt   *time.Time     `json:"deleted_at,omitempty"`
}
