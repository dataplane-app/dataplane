package permissions

import (
	"errors"

	"github.com/dataplane-app/dataplane/app/mainapp/database/models"
	"gorm.io/gorm"
)

func AccessGroupPermissionsSQLConstruct(db *gorm.DB, subject string, subject_id string, input []models.Permissions) (string, []Checkstruct, error) {

	/* Direct permission to user */
	// singleBase := `
	// 	select p.access, p.subject, p.subject_id, p.resource, p.resource_id, p.environment_id
	// 	from
	// 	permissions p
	// 	where
	// 	p.subject = ? and p.subject_id = ? and p.active = true and p.environment_id = ?
	// 	`

	// log.Println(singleBase)
	rid := []Checkstruct{}
	permresult := "denied"

	// Session(&gorm.Session{DryRun: true}).

	stmt := db.Debug().Table(models.Permissions{}.TableName()+" AS p").Select("p.access", "p.subject", "p.subject_id", "p.resource", "p.resource_id", "p.environment_id")

	// For all permissions needs the subject
	stmt = stmt.Where("agu.user_id = ? and p.subject = ? and p.active = ? and agu.active = ?", subject_id, "access_group", true, true)

	stmt = stmt.Joins("inner join permissions_accessg_users agu on p.subject_id = agu.access_group_id and p.environment_id = agu.environment_id")

	var criteria *gorm.DB
	// // Group for different levels:
	// // ----- Is this an admin
	// log.Println("Permission len:", len(input))
	if !(len(input) > 0) {
		return "denied", []Checkstruct{}, errors.New("Error no permissions requested.")
	}
	for c, i := range input {

		if c == 0 {
			criteria = db.Or(db.Where("p.resource=? and p.resource_id=? and p.access = ? and p.environment_id = ?", i.Resource, i.ResourceID, i.Access, i.EnvironmentID))
		} else {
			criteria = criteria.Or(db.Where("p.resource=? and p.resource_id=? and p.access = ? and p.environment_id = ?", i.Resource, i.ResourceID, i.Access, i.EnvironmentID))
		}

	}
	//

	stmt = stmt.Where(criteria)

	stmt = stmt.Find(&models.Permissions{})

	result := stmt.Scan(&rid)

	if result.Error != nil {
		return "denied", []Checkstruct{}, result.Error
	}

	return permresult, rid, nil
}
