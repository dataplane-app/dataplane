package worker

import (
	"log"

	"github.com/go-co-op/gocron"
	"gorm.io/gorm"
)

func WorkerRemovalListen(s *gocron.Scheduler, db *gorm.DB) {
	/* Reply to mainapp request */

	// Clear stale workers and worker groups on spin up
	err2 := db.Exec(`
		delete from workers where updated_at < now() at time zone 'utc' - INTERVAL '2 seconds'
		`)
	if err2.Error != nil {
		log.Println(err2.Error.Error())
	}

	err2 = db.Exec(`
	delete from worker_groups where updated_at < now() at time zone 'utc' - INTERVAL '2 seconds'
	`)
	if err2.Error != nil {
		log.Println(err2.Error.Error())
	}

	s.Every(1).Seconds().Do(func() {

		// Clear stale workers and worker groups on spin up
		err2 := db.Exec(`
		delete from workers where updated_at < now() at time zone 'utc' - INTERVAL '2 seconds'
		`)
		if err2.Error != nil {
			log.Println(err2.Error.Error())
		}

		err2 = db.Exec(`
	delete from worker_groups where updated_at < now() at time zone 'utc' - INTERVAL '2 seconds'
	`)
		if err2.Error != nil {
			log.Println(err2.Error.Error())
		}
	})

}
