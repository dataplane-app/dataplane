package permissions

import (
	"dataplane/database/models"
	"dataplane/logme"
	"errors"
)

/*
No need to check permissions if creating an org - permissions are specific to org and down
*/
func CheckAllPermission(
	currentEnv string,
	subjectType string,
	subjectID string,
	resourceType string,
	resourceID string,
	acccess string) (string, error) {

	// ------- Collect grants -------
	// dbstart := time.Now().UTC()

	if currentEnv == "" {
		currentEnv = "d_platform"
	}

	PlatformAdminGoRoutine := make(chan CheckResult)
	go PlatformAdminCheck(subjectID, resourceID, PlatformAdminGoRoutine)

	// TeamCheckGoRoutine := make(chan CheckResult)
	// go TeamCheck(currentOrg, resource, resource_id, currentUser, access, TeamCheckGoRoutine)

	// OrgOwnerCheckGoRoutine := make(chan CheckResult)
	// go OrgOwnerCheck(currentOrg, currentUser, OrgOwnerCheckGoRoutine)

	// ProjectOwnerCheckGoRoutine := make(chan CheckResult)
	// go ProjectOwnerCheck(currentOrg, currentUser, currentProject, ProjectOwnerCheckGoRoutine)

	// Collect the results
	PlatformAdminCheck := <-PlatformAdminGoRoutine
	// TeamCheckResult := <-TeamCheckGoRoutine
	// OrgOwnerCheckResult := <-OrgOwnerCheckGoRoutine
	// ProjectOwnerCheckResult := <-ProjectOwnerCheckGoRoutine

	// dbstop := time.Now().UTC()
	// dbms := dbstop.Sub(dbstart).Microseconds()
	// dbtime := float64(dbms) / 1000

	if PlatformAdminCheck.Perm_error != nil {
		errstring := "Platform admin permissions check fail"
		logme.PlatformLogger(models.LogsPlatform{
			Environment: currentEnv,
			Category:    "permissions",
			LogType:     "error", //can be error, info or debug
			Log:         errstring,
			ErrorMsg:    PlatformAdminCheck.Perm_error.Error(),
		})
		return "", errors.New(errstring)
	}

	// if TeamCheckResult.Perm_error != nil {
	// 	errstring := "Team check fail"
	// 	gusherror.ReportError(errstring, TeamCheckResult.Perm_error)
	// 	return c.Status(500).JSON(fiber.Map{"r": "fail", "msg": errstring, "count": 0})
	// }

	// if OrgOwnerCheckResult.Perm_error != nil {
	// 	errstring := "Org owner check fail"
	// 	gusherror.ReportError(errstring, OrgOwnerCheckResult.Perm_error)
	// 	return c.Status(500).JSON(fiber.Map{"r": "fail", "msg": errstring, "count": 0})
	// }

	// if ProjectOwnerCheckResult.Perm_error != nil {
	// 	errstring := "Project owner check fail"
	// 	gusherror.ReportError(errstring, ProjectOwnerCheckResult.Perm_error)
	// 	return c.Status(500).JSON(fiber.Map{"r": "fail", "msg": errstring, "count": 0})
	// }

	// log.Println("User check result:", UserCheckResult)
	// log.Println("Team check result:", TeamCheckResult)
	// log.Println("Org Owner check result:", OrgOwnerCheckResult)
	// log.Println("Project Owner check result:", ProjectOwnerCheckResult)

	if PlatformAdminCheck.Result == "denied" { //&&
		// TeamCheckResult.Result == "denied" &&
		// OrgOwnerCheckResult.Result == "denied" &&
		// ProjectOwnerCheckResult.Result == "denied" {
		return "denied", nil
	}

	return "grant", nil
}
