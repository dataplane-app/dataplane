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

	var NegativeScenariosData = []Scenarios{
		{Title: "I can add an environment", Outcome: true, User: "environment@email.com"},
		{Title: "I can add or remove a user", Outcome: true},
	}

	log.Println(NegativeScenariosData)

	// Test positive permissions
	// for i, v := range UserData {
	// 	PositiveScenariosData

	// }

}
