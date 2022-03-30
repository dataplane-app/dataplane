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

func (ResourceTypeStruct) IsEntity() {}

func (ResourceTypeStruct) TableName() string {
	return "permissions_resource_types"
}

type ResourceTypeStruct struct {
	Code       string `gorm:"PRIMARY_KEY;"`
	Label      string
	Level      string
	Access     string
	ResourceID string
}

var ResourceType = []*ResourceTypeStruct{

	// Platform level
	{Code: "admin_platform", Level: "platform", Label: "Admin", Access: "write"},
	{Code: "platform_environment", Level: "platform", Label: "Manage environments", Access: "write"},
	{Code: "platform_manage_users", Level: "platform", Label: "Manage users", Access: "write"},

	// Environment level
	{Code: "admin_environment", Level: "environment", Label: "Environment admin", Access: "write"},
	// To add an admin user - you will need admin rights
	{Code: "environment_add_user", Level: "environment", Label: "Add user to environment", Access: "write"},
	{Code: "environment_remove_user", Level: "environment", Label: "Remove user from environment", Access: "write"},
	{Code: "environment_permissions", Level: "environment", Label: "Manage permissions", Access: "write"},
	{Code: "environment_all_pipelines", Level: "environment", Label: "View all pipelines", Access: "read"},
	{Code: "environment_edit_all_pipelines", Level: "environment", Label: "Edit all pipelines", Access: "write"},
	{Code: "environment_run_all_pipelines", Level: "environment", Label: "Run all pipelines", Access: "write"},

	{Code: "environment_secrets", Level: "environment", Label: "Manage secrets", Access: "write"},
	{Code: "environment_edit_workers", Level: "environment", Label: "Manage workers", Access: "write"},
	{Code: "environment_view_workers", Level: "environment", Label: "View workers", Access: "read"},

	// Deployments
	{Code: "environment_deploy_here", Level: "environment", Label: "Deploy pipelines to this environment", Access: "write"},

	// Specific level
	// {Code: "specific_worker", Level: "specific", Label: "Worker - ${{worker_name}}",},
	{Code: "specific_pipeline", Level: "specific", Label: "Pipeline - ${{pipeline_name}}"},
}

/* Access: what type of access does the user have to the resource - read, write */
var AccessTypes = []string{"read", "write", "run", "deploy", "assign_pipeline_permission"}

// -------------- Permissions

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
	Resource   string `gorm:"index:idx_permissions,unique;type:varchar(64);" json:"resource" validate:"required"`
	ResourceID string `gorm:"index:idx_permissions,unique;type:varchar(64);" json:"resource_id" validate:"required"`

	// Type of access - read or write
	Access        string    `gorm:"index:idx_permissions,unique;type:varchar(64);" json:"access" validate:"required"`
	Active        bool      `json:"active" validate:"required"`
	EnvironmentID string    `json:"environment_id"`
	Test          string    `json:"test"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type PermissionsOutput struct {
	ID string `gorm:"PRIMARY_KEY;type:varchar(64);" json:"id" validate:"required"`

	// Who requires access - user, server, access_group
	Subject   string `gorm:"index:idx_permissions,unique;type:varchar(64);" json:"subject" validate:"required"`
	SubjectID string `gorm:"index:idx_permissions,unique;type:varchar(64);" json:"subject_id" validate:"required"`

	// To which resource
	Resource   string `gorm:"index:idx_permissions,unique;type:varchar(64);" json:"resource" validate:"required"`
	ResourceID string `gorm:"index:idx_permissions,unique;type:varchar(64);" json:"resource_id" validate:"required"`

	// Type of access - read or write
	Access        string    `gorm:"index:idx_permissions,unique;type:varchar(64);" json:"access" validate:"required"`
	Level         string    `json:"level"`
	Label         string    `json:"label"`
	Active        bool      `json:"active" validate:"required"`
	EnvironmentID string    `json:"environment_id"`
	Test          string    `json:"test"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

// -------------- Access groups

func (PermissionsAccessGroups) IsEntity() {}

func (PermissionsAccessGroups) TableName() string {
	return "permissions_access_groups"
}

type PermissionsAccessGroups struct {
	AccessGroupID string `gorm:"PRIMARY_KEY;type:varchar(64);" json:"access_group_id" validate:"required"`

	// Who requires access - user, server, access_group
	Name          string    `json:"name"` //???
	Description   string    `json:"description"`
	Active        bool      `json:"active" validate:"required"`
	EnvironmentID string    `json:"environment_id"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

// -------------- The mapping of access groups to users
func (PermissionsAccessGUsers) IsEntity() {}

func (PermissionsAccessGUsers) TableName() string {
	return "permissions_accessg_users"
}

type PermissionsAccessGUsers struct {
	AccessGroupID string    `gorm:"PRIMARY_KEY;type:varchar(64);" json:"access_group_id" validate:"required"`
	UserID        string    `gorm:"PRIMARY_KEY;type:varchar(64);" json:"user_id" validate:"required"`
	Active        bool      `json:"active" validate:"required"`
	EnvironmentID string    `json:"environment_id"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type PermissionsAccessGUsersOutput struct {
	AccessGroupID string    `gorm:"PRIMARY_KEY;type:varchar(64);" json:"access_group_id" validate:"required"`
	Name          string    `json:"name"` //???
	UserID        string    `gorm:"PRIMARY_KEY;type:varchar(64);" json:"user_id" validate:"required"`
	Active        bool      `json:"active" validate:"required"`
	EnvironmentID string    `json:"environment_id"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}
