package testutils

import (
	"dataplane/mainapp/database/models"
)

type UserTestDataPerms struct {
	UserID        string
	Username      string
	Password      string
	Environment   string
	EnvironmentID string
	Permissions   []models.Permissions
}

// ---- Users
var UserData = map[string]*UserTestDataPerms{
	"environment": {
		UserID:      "environment",
		Username:    "environment@email.com",
		Password:    "environment123!",
		Environment: "Development",
		Permissions: []models.Permissions{
			{Resource: "admin_platform", Access: "write", Active: true},
			{Resource: "platform_environment", Access: "write", Active: true},
		},
	},
	"user_environment": {
		UserID:      "user_environment",
		Username:    "environment.user@email.com",
		Password:    "environmentUser123!",
		Environment: "Development",
		Permissions: []models.Permissions{
			{Resource: "environment_add_user", Access: "write", Active: true},
			{Resource: "environment_remove_user", Access: "write", Active: true},
		},
	},
	"development_env_user": {
		UserID:        "development_env_user",
		Username:      "user@development.com",
		Password:      "development123!",
		Environment:   "Development",
		EnvironmentID: "",
		Permissions:   []models.Permissions{},
	},
	"changeuserpassword": {
		UserID:        "changeuserpassword",
		Username:      "changeuserpassword@email.com",
		Password:      "changepassword123!",
		Environment:   "Development",
		EnvironmentID: "",
		Permissions:   []models.Permissions{},
	},
	"changemypassword": {
		UserID:        "changemypassword",
		Username:      "changenypassword@email.com",
		Password:      "changepassword123!",
		Environment:   "Development",
		EnvironmentID: "",
		Permissions:   []models.Permissions{},
	},
	"changeuser": {
		UserID:        "changeuser",
		Username:      "changeuser@email.com",
		Password:      "changeuser123!",
		Environment:   "Development",
		EnvironmentID: "",
		Permissions:   []models.Permissions{},
	},
	"addremoveuser_environment": {
		UserID:        "addremoveuser_environment",
		Username:      "addremoveuser@email.com",
		Password:      "changepassword123!",
		Environment:   "Development",
		EnvironmentID: "",
		Permissions:   []models.Permissions{},
	},
}
