package permissions

import "dataplane/database"

/*
Check
1. Belong to org
2. Subject (user/team)
3. has right access to resource & resource id
*/
// ------- USER CHECK
func PlatformAdminCheck(subjectID string, resourceID string, c chan CheckResult) (Checkstruct, error) {

	//start := time.Now()
	rid := Checkstruct{}

	result := database.DBConn.Raw(
		`select 
		access,
		subject,
		subject_id,
		resource,
		resource_id
		from 
		permissions p
		where 
		p.subject = 'user' and 
		p.subject_id = ? and
		p.resource = 'admin_platform' 
		p.resource_id = ?
		and p.access='write'
		and p.active = true limit 1
`,
		subjectID,
		resourceID,
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
		return rid, result.Error
	}

	r := "denied"
	if result.RowsAffected > 0 {
		r = "grant"
	}
	c <- CheckResult{
		Subject: "user",
		Count:   result.RowsAffected,
		Perm:    rid,
		Result:  r,
	}
	return rid, nil

}
