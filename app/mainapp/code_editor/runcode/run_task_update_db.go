package runcode

import (
	"github.com/dataplane-app/dataplane/app/mainapp/database"
	"github.com/dataplane-app/dataplane/app/mainapp/database/models"
	"github.com/dataplane-app/dataplane/app/mainapp/logging"

	"gorm.io/gorm/clause"
)

func UpdateCodeRun(msg models.CodeRun) {

	/* The go routine causes the update to happen after sent to run next
	Better to run in sequence for proper status update before running next part of the graph
	*/
	// go func() {

	err2 := database.DBConn.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "run_id"}},
		DoUpdates: clause.AssignmentColumns([]string{"ended_at", "status", "reason"}),
	}).Create(&msg)
	if err2.Error != nil {
		logging.PrintSecretsRedact(err2.Error.Error())
	}

	// }()

}

func UpdateCodeRunNoStatus(msg models.CodeRun) {

	/* The go routine causes the update to happen after sent to run next
	Better to run in sequence for proper status update before running next part of the graph
	*/
	// go func() {

	err2 := database.DBConn.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "run_id"}},
		DoUpdates: clause.AssignmentColumns([]string{"ended_at", "created_at"}),
	}).Create(&msg)
	if err2.Error != nil {
		logging.PrintSecretsRedact(err2.Error.Error())
	}

	// }()

}
