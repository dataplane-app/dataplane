package scheduler

import (
	"dataplane/database"
	"dataplane/database/models"
	"dataplane/logging"
	"errors"
	"fmt"
	"log"
	"os"
	"regexp"
	"strings"
	"time"

	"github.com/go-co-op/gocron"
)

func SchedulerStart() error {
	// Takes rrule and returns gocron string ex. "FREQ=SECONDLY;INTERVAL=30" => "30s"
	rule, _ := rruleToGocron()

	s := gocron.NewScheduler(time.UTC)

	_, nextRun := s.NextRun()
	fmt.Println("Main: The next run: ", nextRun)
	fmt.Println("Rule: ", rule)

	s.Every(rule).Do(func() {
		log.Println("A: Published at (every minute): ", time.Now())
		_, nextRun = s.NextRun()
		fmt.Println("A: The next run: (every "+rule+")", nextRun)
	})

	s.Every(7).Seconds().Do(func() {
		log.Println("B: Published at (every 7 seconds): ", time.Now())
		// When is the next one coming and if so, did it run at that time.
		_, nextRun = s.NextRun()
		fmt.Println("B: The next run: (every 7 seconds)", nextRun)
	})

	s.StartAsync()
	fmt.Println("Number of jobs scheduled:", s.Jobs())
	fmt.Println("Running:", s.IsRunning())

	return nil
}

func rruleToGocron() (rule string, Err error) {
	u := models.Pipelines{}

	err := database.DBConn.Where("active = ?", true).First(&u).Error

	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("database error")
	}

	// Extract interval value
	re := regexp.MustCompile(`INTERVAL=(\d+)`)
	output := re.FindStringSubmatch((u.Schedule))
	interval := output[1]

	// Extract frequency value
	re = regexp.MustCompile(`FREQ=(\w+)`)
	output = re.FindStringSubmatch((u.Schedule))
	freq := output[1]
	freqFirstLetter := strings.ToLower(freq[:1])

	rule = interval + freqFirstLetter

	return rule, nil
}
