package platform

import (
	"dataplane/mainapp/database"
	"dataplane/mainapp/database/models"
	"log"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func UpdateLeader(nodeID string) {

	// Remove all leaders older than 2 seconds
	err2 := database.DBConn.Exec(`
		delete from platform_leader where updated_at < now() at time zone 'utc' - INTERVAL '2 seconds'
		`)
	if err2.Error != nil {
		log.Println(err2.Error.Error())
	}

	// Is there a leader?
	var leader models.PlatformLeader
	err2 = database.DBConn.First(&leader)
	if err2.Error != nil && err2.Error != gorm.ErrRecordNotFound {
		log.Println(err2.Error.Error())
	}

	// if no leader found, elect a leader
	if err2.Error == gorm.ErrRecordNotFound {
		LeaderElection()
	}

	// If the the leader is the current node, update the time using postgresql clock to avoid time drift
	if leader.NodeID == nodeID {
		err2 = database.DBConn.Model(&models.PlatformLeader{}).Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "leader"}},
			DoUpdates: clause.AssignmentColumns([]string{"updated_at"}),
		}).Create(map[string]interface{}{
			"leader":     true,
			"node_id":    nodeID,
			"updated_at": gorm.Expr("now() at time zone 'utc'"),
		})
		if err2.Error != nil {
			log.Println(err2.Error.Error())
		}
	}

	// Remove all scheduler lease locks older than 2 seconds
	err2 = database.DBConn.Exec(`
		delete from scheduler_lock where lock_lease < now() at time zone 'utc' - INTERVAL '2 seconds'
		`)
	if err2.Error != nil {
		log.Println(err2.Error.Error())
	}

}
