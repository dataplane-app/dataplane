package sections

import (
	"errors"

	"github.com/dataplane-app/dataplane/app/mainapp/Tests/testutils"
	"github.com/dataplane-app/dataplane/app/mainapp/database/models"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// ----- Deploy from Permissions
// var DeploymentFromPerms = make(map[string][]models.Permissions)
// var DeploymentFromPerms testutils.TestStruct

func CheckDeployPermissions(db *gorm.DB) (error, testutils.TestStruct) {

	// Create Users for testing
	Perms := []models.Permissions{

		// Positive tests
		{ID: "TESTDEPLOY1", Subject: "user", SubjectID: "DeploySpecific", Resource: "specific_pipeline", ResourceID: testutils.PipelineID, Access: "deploy", EnvironmentID: testutils.TestEnvironmentPerm, Active: true, Test: "T"},
		{ID: "TESTDEPLOY2", Subject: "user", SubjectID: "DeployAll", Resource: "environment_deploy_all_pipelines", ResourceID: testutils.TestEnvironmentPerm, Access: "write", EnvironmentID: testutils.TestEnvironmentPerm, Active: true, Test: "T"},
	}

	// Map to environments
	err := db.Clauses(clause.OnConflict{
		UpdateAll: true,
	}).Create(&Perms).Error
	if err != nil {
		return errors.New("Failed create deploy permissions for scenario tests"), testutils.TestStruct{}
	}

	// "DeployCombine1", "DeployCombine2", "DeploySpecificAG"

	return nil, testutils.TestStruct{
		GrantUsersToTest: []string{"A1", "EA1", "DeploySpecific", "DeployAll"},
		DenyUsersToTest:  []string{"Unknown", "PipelineView", "PipelineRunSpecificAG", "DeployWrongEnv"},
		Permissions: []models.Permissions{
			{Resource: "admin_platform", ResourceID: "TestplatformID", Access: "write", EnvironmentID: "d_platform"},
			{Resource: "admin_environment", ResourceID: testutils.TestEnvironmentPerm, Access: "write", EnvironmentID: testutils.TestEnvironmentPerm},
			{Resource: "environment_deploy_all_pipelines", ResourceID: testutils.TestEnvironmentPerm, Access: "write", EnvironmentID: testutils.TestEnvironmentPerm},
			{Resource: "specific_pipeline", ResourceID: testutils.PipelineID, Access: "deploy", EnvironmentID: testutils.TestEnvironmentPerm},
		},
	}
}

// DeploymentToPerms["A1"] := []models.Permissions{
// 	{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
// 	{Subject: "user", SubjectID: currentUser, Resource: "admin_environment", ResourceID: toEnvironmentID, Access: "write", EnvironmentID: toEnvironmentID},
// 	{Subject: "user", SubjectID: currentUser, Resource: "environment_deploy_here", ResourceID: toEnvironmentID, Access: "write", EnvironmentID: toEnvironmentID},
// }

// log.Println(perms)
