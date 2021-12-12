package permissions

import (
	"dataplane/database/models"
	"dataplane/logging"
	"os"
)

func MultiplePermissionChecks(
	multiPermissions []models.Permissions,
) (permOuctome string, outcomes []CheckResult, Admin string, EnvAdmin string) {

	c := make(chan CheckResult)

	for _, singlePerm := range multiPermissions {
		// fmt.Println("key: ", k, " - ", url)

		go PermissionSingleCheck(
			singlePerm.Subject,
			singlePerm.SubjectID,
			singlePerm.Resource,
			singlePerm.ResourceID,
			singlePerm.Access,
			singlePerm.EnvironmentID,
			c)
	}

	// get the results back
	outcomes = make([]CheckResult, len(multiPermissions))

	permOuctome = "denied"
	Admin = "no"
	EnvAdmin = "no"

	// Determin Admins
	for i, _ := range outcomes {
		outcomes[i] = <-c
		// fmt.Println("key: ", i, " - ", outcomes[i])
		if os.Getenv("debug") == "debug" {
			logging.PrintSecretsRedact("Perms: ", outcomes[i].Perm.Subject, outcomes[i].Result)
		}

		// If platform admin
		if outcomes[i].Perm.Resource == "admin_platform" {
			Admin = "yes"
		}

		// if Environment admin
		if outcomes[i].Perm.Resource == "admin_environment" {
			EnvAdmin = "yes"
		}

		// If one allowed permission is found, grant access
		if outcomes[i].Result == "grant" {
			permOuctome = "grant"
		}
	}

	return permOuctome, outcomes, Admin, EnvAdmin
}
