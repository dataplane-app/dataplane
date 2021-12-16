package scheduler

import (
	"fmt"
	"log"
	"time"

	"github.com/go-co-op/gocron"
)

func SchedulerStart() {
	s := gocron.NewScheduler(time.UTC)

	s.Every(5).Seconds().Do(func() {
		log.Println("A: Published at (every 5 seconds): ", time.Now())
	})

	s.Every(7).Seconds().Do(func() {
		log.Println("B: Published at (every 7 seconds): ", time.Now())
		// When is the next one coming and if so, did it run at that time.
	})

	_, time := s.NextRun()
	fmt.Println(time)

	// s.RunAll()
	s.StartAsync()
}
