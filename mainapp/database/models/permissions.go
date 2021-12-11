package models

import "time"

// Constraints

/*
Subject types are users or access groups to which they belong.
Who is requesting access?
*/
var SubjectType = []string{"user", "access_group", "server"}

/*
Resource types are resources that users want access to.
Requesting access to what?
*/

type ResourceTypeStruct struct {
	Code  string
	Label string
	Level string
}

var ResourceType = []*ResourceTypeStruct{
	{Code: "admin_platform", Level: "platform", Label: "Admin"},
	{Code: "platform_environment", Level: "platform", Label: "Manage environments"},
	{Code: "platform_users", Level: "platform", Label: "Manage users"},
	{Code: "platform_permissions", Level: "platform", Label: "Manage permissions"},
	{Code: "admin_environment", Level: "environment", Label: "Admin"},
	{Code: "environment_all_pipelines", Level: "environment", Label: "View all pipelines"},
	{Code: "environment_secrets", Level: "environment", Label: "Manage secrets"},
	{Code: "environment_edit_workers", Level: "environment", Label: "Manage workers"},
	{Code: "specific_worker", Level: "specific", Label: "Worker - ${{worker_name}}"},
	{Code: "specific_pipeline", Level: "specific", Label: "Pipeline - ${{pipeline_name}}"},
}

func (Permissions) IsEntity() {}

func (Permissions) TableName() string {
	return "permissions"
}

type Permissions struct {
	ID string `gorm:"PRIMARY_KEY;type:varchar(64);" json:"id" validate:"required"`

	// Who requires access - user, server, access_group
	Subject   string `gorm:"index:idx_permissions,unique;type:varchar(64);" json:"subject" validate:"required"`
	SubjectID string `gorm:"index:idx_permissions,unique;type:varchar(64);" json:"subject_id" validate:"required"`

	// To which resource
	Resource    string    `gorm:"index:idx_permissions,unique;type:varchar(64);" json:"resource" validate:"required"`
	ResourceID  string    `gorm:"index:idx_permissions,unique;type:varchar(64);" json:"resource_id" validate:"required"`
	Access      string    `gorm:"index:idx_permissions,unique;type:varchar(64);" json:"access" validate:"required"`
	Active      bool      `json:"active" validate:"required"`
	Environment string    `json:"environment"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
