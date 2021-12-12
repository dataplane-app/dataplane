package testutils

import (
	"dataplane/database/models"
)

type UserTestDataPerms struct {
	Username      string
	Password      string
	Environment   string
	EnvironmentID string
	Permissions   []models.Permissions
}

// ---- Users
var UserData = map[string]*UserTestDataPerms{
	"environment": {
		Username:      "environment@email.com",
		Password:      "environment123!",
		Environment:   "Development",
		EnvironmentID: "",
		Permissions: []models.Permissions{
			{Resource: "admin_platform", Access: "write", Active: true},
			{Resource: "platform_environment", Access: "write", Active: true},
		},
	},
	"changeuserpassword": {
		Username:      "changeuserpassword@email.com",
		Password:      "changepassword123!",
		Environment:   "Development",
		EnvironmentID: "",
		Permissions:   []models.Permissions{},
	},
	"changemypassword": {
		Username:      "changenypassword@email.com",
		Password:      "changepassword123!",
		Environment:   "Development",
		EnvironmentID: "",
		Permissions:   []models.Permissions{},
	},
}
