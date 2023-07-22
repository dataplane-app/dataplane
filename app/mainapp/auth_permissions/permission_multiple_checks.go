package permissions

import (
	"errors"

	"github.com/dataplane-app/dataplane/app/mainapp/database"
	"github.com/dataplane-app/dataplane/app/mainapp/database/models"
)

func MultiplePermissionChecks(multiPermissions []models.Permissions) (permOuctome string, outcomes []CheckResult, Admin string, EnvAdmin string) {

	if !(len(multiPermissions) > 0) {
		return "denied", []CheckResult{
			{Subject: "user",
				Count:      0,
				Perm_error: errors.New("Error no permissions requested in multi permission checks."),
				Result:     "denied",
			},
		}, "no", "no"
	}

	_, responseDirect, errDirect := DirectPermissionsSQLConstruct(database.DBConn, multiPermissions[0].Subject, multiPermissions[0].SubjectID, multiPermissions)

	if errDirect != nil {
		return "denied", []CheckResult{
			{Subject: "user",
				Count:      0,
				Perm_error: errDirect,
				Result:     "denied",
			},
		}, "no", "no"

	}
	// c := make(chan CheckResult)

	// // get the results back
	// outcomes = make([]CheckResult, len(multiPermissions))

	permOuctome = "denied"
	Admin = "no"
	EnvAdmin = "no"

	/* If records come back then allowed, test if admin */
	if len(responseDirect) > 0 {
		permOuctome = "grant"

		// Determin Admins
		for _, p := range responseDirect {
			// If platform admin
			if p.Resource == "admin_platform" {
				Admin = "yes"
			}

			// if Environment admin
			if p.Resource == "admin_environment" {
				EnvAdmin = "yes"
			}
		}
		return permOuctome, outcomes, Admin, EnvAdmin
	}

	// If there are no direct grants, looks for access group grants

	return permOuctome, outcomes, Admin, EnvAdmin
}
