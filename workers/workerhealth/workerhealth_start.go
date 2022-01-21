package workerhealth

import (
	"log"
	"os"
	"time"

	"github.com/go-co-op/gocron"
)

func WorkerHealthStart() {
	s := gocron.NewScheduler(time.UTC)

	s.Every(5).Seconds().Do(func() {
		if os.Getenv("debug") == "true" {
			log.Println("Worker health: ", time.Now())
		}
		// s.NextRun()

		// record in the database and send status to mainapp

	})

	s.StartAsync()
}
