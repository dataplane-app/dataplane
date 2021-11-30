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
	NextRun   string         `json:"nextrun"`
	LastRun   string         `json:"lastrun"`
	TotalRuns int            `json:"totalruns"`
	Status    string         `json:"status"`
	IsOnline  bool           `json:"isonline"`
	MyDate    datatypes.Date `json:"my_date"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt *time.Time     `json:"updated_at"`
	DeletedAt *time.Time     `json:"deleted_at,omitempty"`
	// CountryName          string     `gorm:"type:varchar(255);" json:"country_name"`
	// Currency             string     `gorm:"type:varchar(64);" json:"currency"`
	// WorkerPricePerc      float64    `json:"worker_price_perc"`
	// ClientPriceFixed     float64    `json:"client_price_fixed"`
	// WorkerInstantPayPerc float64    `json:"worker_instant_perc"`
	// InstantPayoutAvail   bool       `json:"instant_payout_avail"`
	// PaymentProvider      string     `json:"payment_provider"`
	// PPFeePerc            float64    `json:"pp_fee_perc"`
	// PPFeeFixed           float64    `json:"pp_fee_fixed"`
	// PPFeePayoutPerc      float64    `json:"pp_fee_payout_perc"`
	// PaymentMethod        string     `json:"payment_method"`
	// Active               bool       `gorm:"type:boolean;" json:"active,omitempty"`
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
