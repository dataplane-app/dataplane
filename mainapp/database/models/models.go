// https://github.com/version-1/gin-gorm-gqlgen-sample/blob/master/src/gin_graphql/resolver.go

package models

import (
	"time"

	"gorm.io/datatypes"
)

func (Pipelines) IsEntity() {}

func (Pipelines) TableName() string {
	return "pipelines"
}

type Pipelines struct {
	Name      string         `gorm:"PRIMARY_KEY;type:varchar(10);" json:"name"`
	Trigger   string         `json:"trigger"`
	NextRun   datatypes.Date `json:"nextrun"`
	LastRun   datatypes.Date `json:"lastrun"`
	TotalRuns int            `json:"totalruns"`
	Status    string         `json:"status"`
	IsOnline  bool           `json:"isonline"`
	MyDate    datatypes.Date `json:"my_date"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt *time.Time     `json:"updated_at"`
	DeletedAt *time.Time     `json:"deleted_at,omitempty"`
}

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
