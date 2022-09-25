package permissions

import "github.com/dataplane-app/dataplane/app/mainapp/database"

type permOutcome struct {
	permdriver string
	result     string
}

/*
No need to check permissions if creating an org - permissions are specific to org and down
*/
func PermissionSingleCheck(
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

	/* Access groups operate at environment level. The environment id will be equal to provided environment id. */
	result := database.DBConn.Raw(
		`
		(select 
		p.access,
		p.subject,
		p.subject_id,
		p.resource,
		p.resource_id,
		p.environment_id
		from 
		permissions p
		where 
		p.subject = ? and 
		p.subject_id = ? and
		p.resource = ? and
		p.resource_id = ?
		and p.access= ?
		and p.environment_id = ?
		and p.active = true
		)
		union
		(
		select
		p.access,
		p.subject,
		p.subject_id,
		p.resource,
		p.resource_id,
		p.environment_id
		from 
		permissions p, permissions_accessg_users agu
		where 
		p.subject = 'access_group' and 
		p.subject_id = agu.access_group_id and
		agu.user_id = ? and
		p.resource = ? and
		p.resource_id = ?
		and p.access= ?
		and p.environment_id = ?
		and p.environment_id = agu.environment_id
		and p.active = true
		and agu.active = true
		)
`,
		//direct
		subjectType,
		subjectID,
		resourceType,
		resourceID,
		acccess,
		environment,

		// access group
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
