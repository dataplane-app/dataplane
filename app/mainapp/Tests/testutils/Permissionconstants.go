package testutils

import "github.com/dataplane-app/dataplane/app/mainapp/database/models"

type TestStruct struct {
	GrantUsersToTest []string
	DenyUsersToTest  []string
	Permissions      []models.Permissions
}

var TestEnvironmentPerm = "TestDev"
var PipelineID = "1"
