package platform

import (
	"dataplane/mainapp/database"
	"dataplane/mainapp/database/models"
	"log"
	"time"

	"gorm.io/gorm/clause"
)

func RegisterNode(nodeID string) {

	now := time.Now().UTC()

	err2 := database.DBConn.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "node_id"}},
		DoUpdates: clause.AssignmentColumns([]string{"updated_at"}),
	}).Create(&models.PlatformNodes{
		NodeID:    nodeID,
		UpdatedAt: &now,
	})
	if err2.Error != nil {
		log.Println(err2.Error.Error())
	}

	// Remove all nodes older than 5 seconds
	err2 = database.DBConn.Exec(`
	delete from platform_nodes where updated_at < now() at time zone 'utc' - INTERVAL '5 seconds'
	`)
	if err2.Error != nil {
		log.Println(err2.Error.Error())
	}

	// Is there a leader?
	var leaders []*models.PlatformNodes
	err2 = database.DBConn.Where("lead = true").Find(&leaders)
	if err2.Error != nil {
		log.Println(err2.Error.Error())
	}

	if len(leaders) != 1 {
		LeaderElection()
	}

	// Remove all scheduler lease locks older than 5 seconds
	err2 = database.DBConn.Exec(`
		delete from scheduler_lock where lock_lease < now() at time zone 'utc' - INTERVAL '5 seconds'
		`)
	if err2.Error != nil {
		log.Println(err2.Error.Error())
	}

}
