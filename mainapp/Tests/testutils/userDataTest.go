package testutils

import (
	"dataplane/database/models"
)

type UserTestDataPerms struct {
	Username    string
	Password    string
	Permissions []models.Permissions
}

// ---- Users
var UserData = map[string]UserTestDataPerms{
	"environment": {
		Username: "environment@email.com",
		Password: "environment123!",
		Permissions: []models.Permissions{
			{Resource: "admin_platform", Access: "write", Active: true},
			{Resource: "platform_environment", Access: "write", Active: true},
		},
	},
}
