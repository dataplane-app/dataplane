package tests

import "dataplane/database/models"

type Scenarios struct {
	Title   string
	Outcome bool
	models.Permissions
}

var PositiveScenariosData = []Scenarios{
	{Title: "Admin - everything", Outcome: true},
	{Title: "I can add or edit an environment", Outcome: true},
	{Title: "I can add or remove a user", Outcome: true},
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
