package sections

import (
	"github.com/dataplane-app/dataplane/app/mainapp/Tests/testutils"
	"github.com/dataplane-app/dataplane/app/mainapp/database/models"
)

// ----- Deploy from Permissions
// var DeploymentFromPerms = make(map[string][]models.Permissions)
var DeploymentFromPerms = []models.Permissions{}

func CheckDeployPermissions() {

	DeploymentFromPerms = []models.Permissions{
		{Resource: "admin_platform", ResourceID: "TestplatformID", Access: "write", EnvironmentID: "d_platform"},
		{Resource: "admin_environment", ResourceID: testutils.TestEnvironmentPerm, Access: "write", EnvironmentID: testutils.TestEnvironmentPerm},
		{Resource: "environment_deploy_all_pipelines", ResourceID: testutils.TestEnvironmentPerm, Access: "write", EnvironmentID: testutils.TestEnvironmentPerm},
		{Resource: "specific_pipeline", ResourceID: testutils.PipelineID, Access: "deploy", EnvironmentID: testutils.TestEnvironmentPerm},
	}

	// DeploymentToPerms["A1"] := []models.Permissions{
	// 	{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
	// 	{Subject: "user", SubjectID: currentUser, Resource: "admin_environment", ResourceID: toEnvironmentID, Access: "write", EnvironmentID: toEnvironmentID},
	// 	{Subject: "user", SubjectID: currentUser, Resource: "environment_deploy_here", ResourceID: toEnvironmentID, Access: "write", EnvironmentID: toEnvironmentID},
	// }

}

// log.Println(perms)
