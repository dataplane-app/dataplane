package permissiontests

import (
	"log"
	"testing"

	"github.com/dataplane-app/dataplane/app/mainapp/Tests/permissions/sections"
	permissions "github.com/dataplane-app/dataplane/app/mainapp/auth_permissions"
	"github.com/dataplane-app/dataplane/app/mainapp/database"
	"github.com/dataplane-app/dataplane/app/mainapp/database/models"
	"gorm.io/gorm/clause"
)

/* 	"platform_admin",
"platform_environment",
"platform_users",
"environment_all_pipelines",
"environment_secrets",
"environment_edit_workers",
"specific_worker",
"specific_pipeline",

*/

/*
For individual tests - in separate window run: go run server.go
go test -p 1 -v -count=1 -run TestPermissionsScenarios github.com/dataplane-app/dataplane/app/mainapp/Tests/permissions
*/

func PermConstruct(input map[string][]models.Permissions) []models.Permissions {

	var result []models.Permissions

	for user, val := range input {
		log.Println(user, val)
		for _, val2 := range val {
			result = append(result, models.Permissions{
				Subject:       "user",
				SubjectID:     user,
				Resource:      val2.Resource,
				ResourceID:    val2.ResourceID,
				Access:        val2.Access,
				EnvironmentID: val2.EnvironmentID,
				Test:          "T",
			})
		}
	}
	return result

}

func TestPermissionsScenarios(t *testing.T) {

	// var t *testing.T
	database.DBConnect()

	// TestsSingle
	// 1. Admin user = A1
	// 2. Environment admin user = EA1
	// 3. Specfic user - deploy all pipelines
	// 4. Specific user - deply specific pipeline
	// 5. Combination of 2, 3, 4
	// 6. Combination of 1, 4

	// A1: Create an admin user
	// EA1: Create a Dev environment admin user
	// EA1: Create a Prod environment admin user
	// EA2: Create a Dev only environment admin user
	Perms := []models.Permissions{
		{ID: "TEST1", Subject: "user", SubjectID: "A1", Resource: "admin_platform", ResourceID: "TestplatformID", Access: "write", EnvironmentID: "d_platform", Active: true, Test: "T"},
		{ID: "TEST2", Subject: "user", SubjectID: "EA1", Resource: "admin_environment", ResourceID: "TestDev", Access: "write", EnvironmentID: "TestDev", Active: true, Test: "T"},
		{ID: "TEST3", Subject: "user", SubjectID: "EA1", Resource: "admin_environment", ResourceID: "TestProd", Access: "write", EnvironmentID: "TestProd", Active: true, Test: "T"},
		{ID: "TEST4", Subject: "user", SubjectID: "EA2", Resource: "admin_environment", ResourceID: "TestDev", Access: "write", EnvironmentID: "TestDev", Active: true, Test: "T"},
		{ID: "TEST3", Subject: "user", SubjectID: "EA3", Resource: "admin_environment", ResourceID: "TestProd", Access: "write", EnvironmentID: "TestProd", Active: true, Test: "T"},
	}

	// Map to environments
	err := database.DBConn.Clauses(clause.OnConflict{
		UpdateAll: true,
	}).Create(&Perms).Error
	if err != nil {
		t.Errorf("Failed create admin permissions for scenario tests")
	}

	// Run all tests where active == true

	/* ------  Deployment test ------- */
	sections.CheckDeployPermissions()

	// Is Admin allowed access to deployment?
	permissions.PermissionsSQLConstruct(database.DBConn, "user", "A1", sections.DeploymentFromPerms)

	// Is Env Admin to Dev allowed access to deployment?
	permissions.PermissionsSQLConstruct(database.DBConn, "user", "EA1", sections.DeploymentFromPerms)

	// Is Env Admin to Prod allowed access to deployment?
	permissions.PermissionsSQLConstruct(database.DBConn, "user", "EA3", sections.DeploymentFromPerms)

	// ----------------------------- Run all tests where active = false -------------------------
	// err = database.DBConn.Model(&models.Permissions{}).Where("test=?", "T").Update("active", false).Error
	// if err != nil {
	// 	t.Errorf("Failed to update permissions to inactive for scenario tests")
	// }

}
