package permissiontests

import (
	"dataplane/database/models"
	"log"
	"testing"
)

type Scenarios struct {
	Title   string
	Outcome bool
	User    string
	models.Permissions
}

type UserTestDataPerms struct {
	Username    string
	Permissions []string
}

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
go test -p 1 -v -count=1 -run TestPermissionsScenarios dataplane/Tests/permissions
*/
func TestPermissionsScenarios(t *testing.T) {

	// log.Println(PositiveScenariosData)
	var UserData = map[string]UserTestDataPerms{}

	UserData["environment"] = UserTestDataPerms{
		Username:    "environment@email.com",
		Permissions: []string{"admin_platform", "platform_environment"},
	}

	var PositiveScenariosData = []Scenarios{
		{Title: "I can add an environment", Outcome: true, User: "environment@email.com"},
		{Title: "I can add or remove a user", Outcome: true},
	}

	log.Println(PositiveScenariosData)

}
