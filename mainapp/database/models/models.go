// https://github.com/version-1/gin-gorm-gqlgen-sample/blob/master/src/gin_graphql/resolver.go

package models

import (
	"time"

	"github.com/dgrijalva/jwt-go"
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

func (Users) IsEntity() {}

func (Users) TableName() string {
	return "users"
}

type Users struct {
	UserID    string     `gorm:"PRIMARY_KEY;type:varchar(48);" json:"user_id"`
	Username  string     `gorm:"type:varchar(100);index:idx_username,unique;" json:"username"`
	FirstName string     `json:"first_name"`
	LastName  string     `json:"last_name"`
	Email     string     `json:"email"`
	Password  string     `json:"password"`
	Timezone  string     `json:"timezone"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt *time.Time `json:"updated_at"`
	DeletedAt *time.Time `json:"deleted_at,omitempty"`
}

func (Permissions) IsEntity() {}

func (Permissions) TableName() string {
	return "permissions"
}

type Permissions struct {
	UserID                 string `gorm:"PRIMARY_KEY;type:varchar(48);" json:"user_id"`
	Platform               string `json:"platform"`
	EnvironmentPermissions string `json:"environment_permissions"`
	SpecificPermissions    string `json:"specific_permissions"`
	AccessGroups           string `json:"access_groups"`

	// Username  string     `gorm:"type:varchar(100);index:idx_username,unique;" json:"username"`

	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt *time.Time `json:"updated_at"`
	DeletedAt *time.Time `json:"deleted_at,omitempty"`
}

func (Environment) IsEntity() {}

func (Environment) TableName() string {
	return "environment"
}

type Environment struct {
	UserID                 string `gorm:"PRIMARY_KEY;type:varchar(48);" json:"user_id"`
	Platform               string `json:"platform"`
	EnvironmentPermissions string `json:"environment_permissions"`
	SpecificPermissions    string `json:"specific_permissions"`
	AccessGroups           string `json:"access_groups"`

	// Username  string     `gorm:"type:varchar(100);index:idx_username,unique;" json:"username"`

	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt *time.Time `json:"updated_at"`
	DeletedAt *time.Time `json:"deleted_at,omitempty"`
}

func (UserToEnvironment) IsEntity() {}

func (UserToEnvironment) TableName() string {
	return "userToEnvironment"
}

type UserToEnvironment struct {
	UserID                 string `gorm:"PRIMARY_KEY;type:varchar(48);" json:"user_id"`
	Platform               string `json:"platform"`
	EnvironmentPermissions string `json:"environment_permissions"`
	SpecificPermissions    string `json:"specific_permissions"`
	AccessGroups           string `json:"access_groups"`

	// Username  string     `gorm:"type:varchar(100);index:idx_username,unique;" json:"username"`

	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt *time.Time `json:"updated_at"`
	DeletedAt *time.Time `json:"deleted_at,omitempty"`
}

func (Claims) IsEntity() {}

func (Claims) TableName() string {
	return "claims"
}

// Claims represent the structure of the JWT token
type Claims struct {
	jwt.StandardClaims
	ID uint `gorm:"primaryKey"`
}

func (UserErrors) IsEntity() {}

func (UserErrors) TableName() string {
	return "userErrors"
}

// UserErrors represent the error format for user routes
type UserErrors struct {
	Err      bool   `json:"error"`
	Email    string `json:"email"`
	Username string `json:"username"`
	Password string `json:"password"`
}
