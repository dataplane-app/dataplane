package worker

import (
	"log"
	"os"

	"github.com/dataplane-app/dataplane/mainapp/database"
	"github.com/dataplane-app/dataplane/mainapp/database/models"
	"github.com/dataplane-app/dataplane/mainapp/messageq"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func WorkerListen() {

	// Subscribe all worker updates
	messageq.NATSencoded.QueueSubscribe("workerloadv2", "workerloadv2", func(subj, reply string, msg models.WorkerStats) {

		if os.Getenv("DP_WORKER_DEBUG") == "true" {
			log.Println("rcvd:", msg)
		}

		switch msg.Status {
		case "Online":

			err2 := database.DBConn.Model(&models.WorkerGroups{}).Clauses(clause.OnConflict{
				Columns:   []clause.Column{{Name: "worker_group"}, {Name: "environment_id"}},
				DoUpdates: clause.AssignmentColumns([]string{"updated_at"}),
			}).Create(map[string]interface{}{
				"worker_group":   msg.WorkerGroup,
				"environment_id": msg.EnvID,
				"lb":             msg.LB,
				"worker_type":    msg.WorkerType,
				"updated_at":     gorm.Expr("now() at time zone 'utc'"),
			})
			if err2.Error != nil {
				log.Println(err2.Error.Error())
			}

			err2 = database.DBConn.Model(&models.Workers{}).Clauses(clause.OnConflict{
				Columns:   []clause.Column{{Name: "worker_id"}, {Name: "worker_group"}, {Name: "environment_id"}},
				DoUpdates: clause.AssignmentColumns([]string{"updated_at", "status", "cpu_perc", "load", "memory_perc", "memory_used"}),
			}).Create(map[string]interface{}{
				"worker_id":      msg.WorkerID,
				"worker_group":   msg.WorkerGroup,
				"environment_id": msg.EnvID,
				"status":         msg.Status,
				"cpu_perc":       msg.CPUPerc,
				"load":           msg.Load,
				"memory_perc":    msg.MemoryPerc,
				"memory_used":    msg.MemoryUsed,
				"lb":             msg.LB,
				"worker_type":    msg.WorkerType,
				"updated_at":     gorm.Expr("now() at time zone 'utc'"),
			})
			if err2.Error != nil {
				log.Println(err2.Error.Error())
			}

		}
	})

}
