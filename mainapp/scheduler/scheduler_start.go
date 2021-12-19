package scheduler

import (
	"dataplane/database"
	"dataplane/database/models"
	"dataplane/logging"
	"dataplane/utilities"
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
	u := models.Pipelines{}

	err := database.DBConn.Where("active = ?", true).First(&u).Error

	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return errors.New("database error")
	}

	s := gocron.NewScheduler(time.UTC)
	_, nextRun := s.NextRun()
	fmt.Println("Main: The next run: ", nextRun)

	if strings.Contains(u.Schedule, "SECONDLY") ||
		strings.Contains(u.Schedule, "MINUTELY") ||
		strings.Contains(u.Schedule, "HOURLY") {
		rule, err := rruleToGocron(u.Schedule)
		if err != nil {
			log.Println(err)
		}
		s.Every(rule).Do(func() {
			log.Println("A: Published at (every minute): ", time.Now())
			_, nextRun = s.NextRun()
			fmt.Println("A: The next run: (every "+rule+")", nextRun)
		})
		fmt.Println("Rule: ", rule)

	} else {
		log.Println("Rrule: ", u.Schedule)
		cron, err := utilities.Rtoc(u.Schedule)
		if err != nil {
			log.Println(err)
		}

		s.CronWithSeconds(cron).Do(func() {
			log.Println("A: Published at (every minute): ", time.Now())
			_, nextRun = s.NextRun()
			fmt.Println("A: The next run: (every "+cron+")", nextRun)
		})
		fmt.Println("Cron: ", cron)

	}

	// s.Every(7).Seconds().Do(func() {
	// 	log.Println("B: Published at (every 7 seconds): ", time.Now())
	// 	// When is the next one coming and if so, did it run at that time.
	// 	_, nextRun = s.NextRun()
	// 	fmt.Println("B: The next run: (every 7 seconds)", nextRun)
	// })

	s.StartAsync()
	fmt.Println("Number of jobs scheduled:", s.Jobs())
	fmt.Println("Running:", s.IsRunning())

	return nil
}

// Takes rrule and returns gocron string ex. "FREQ=SECONDLY;INTERVAL=30" => "30s"
func rruleToGocron(rule1 string) (rule string, Err error) {

	log.Println(rule1)
	// Extract interval value
	re := regexp.MustCompile(`INTERVAL=(\d+)`)
	output := re.FindStringSubmatch((rule1))
	interval := output[1]

	// Extract frequency value
	re = regexp.MustCompile(`FREQ=(\w+)`)
	output = re.FindStringSubmatch((rule1))
	freq := output[1]
	freqFirstLetter := strings.ToLower(freq[:1])

	rule = interval + freqFirstLetter

	return rule, nil
}
