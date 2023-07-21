package permissions

import (
	"errors"
	"log"

	"github.com/dataplane-app/dataplane/app/mainapp/database/models"
	"gorm.io/gorm"
)

func PermissionsSQLConstruct(db *gorm.DB, subject string, subject_id string, input []models.Permissions) error {

	/* Direct permission to user */
	// singleBase := `
	// 	select p.access, p.subject, p.subject_id, p.resource, p.resource_id, p.environment_id
	// 	from
	// 	permissions p
	// 	where
	// 	p.subject = ? and p.subject_id = ? and p.active = true and p.environment_id = ?
	// 	`

	// log.Println(singleBase)

	stmt := db.Session(&gorm.Session{DryRun: true}).
		Select("access", "subject", "subject_id", "resource", "resource_id", "environment_id")

		// For all permissions needs the subject
	stmt = stmt.Where("subject = ? and subject_id = ? and active = ?", subject, subject_id, true)

	var criteria *gorm.DB
	// // Group for different levels:
	// // ----- Is this an admin
	// log.Println("Permission len:", len(input))
	if !(len(input) > 0) {
		return errors.New("Error no permissions requested.")
	}
	for c, i := range input {

		if c == 0 {
			criteria = db.Or(db.Where("resource=? and resource_id=? and access = ? and environment_id = ?", i.Resource, i.ResourceID, i.Access, i.EnvironmentID))
		} else {
			criteria = criteria.Or(db.Where("resource=? and resource_id=? and access = ? and environment_id = ?", i.Resource, i.ResourceID, i.Access, i.EnvironmentID))
		}

		// switch i.Resource {
		// case "admin_platform":

		// default:

		// }
		// log.Println(i)

	}
	//

	stmt = stmt.Where(criteria)

	stmt = stmt.Find(&models.Permissions{})

	// {Resource: "admin_platform", ResourceID: "TestplatformID", Access: "write", EnvironmentID: "d_platform"},
	// {Resource: "admin_environment", ResourceID: permissiontests.TestEnvironment, Access: "write", EnvironmentID: permissiontests.TestEnvironment},

	log.Println("SQL Permissions:", stmt.Statement.SQL.String())

	sql := db.ToSQL(func(tx *gorm.DB) *gorm.DB {
		return stmt
	})

	log.Println("SQL Permissions:", sql)

	/*
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
	*/

	// and (p.resource = ? and p.resource_id = ? and p.access= ?)
	return nil
}
