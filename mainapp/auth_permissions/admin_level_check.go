package permissions

import "dataplane/database"

type permOutcome struct {
	permdriver string
	result     string
}

/*
No need to check permissions if creating an org - permissions are specific to org and down
*/
func PermissionAdminLevel(
	subjectType string,
	subjectID string,
	resourceType string,
	resourceID string,
	acccess string,
	environment string,
	c chan CheckResult) (string, error) {

	//start := time.Now()
	rid := Checkstruct{}
	permresult := "denied"

	result := database.DBConn.Raw(
		`select 
		access,
		subject,
		subject_id,
		resource,
		resource_id,
		environment_id
		from 
		permissions p
		where 
		p.subject = ? and 
		p.subject_id = ? and
		p.resource = ? and
		p.resource_id = ?
		and p.access= ?
		and p.environment_id = ?
		and p.active = true limit 1
`,
		subjectType,
		subjectID,
		resourceType,
		resourceID,
		acccess,
		environment,
	).Scan(
		&rid,
	)

	if result.Error != nil {
		c <- CheckResult{
			Subject:    "user",
			Count:      0,
			Perm_error: result.Error,
			Result:     "denied",
		}
		return "denied", result.Error
	}

	if result.RowsAffected > 0 {
		permresult = "grant"
	}
	c <- CheckResult{
		Subject: "user",
		Count:   result.RowsAffected,
		Perm:    rid,
		Result:  permresult,
	}
	return permresult, nil

}
