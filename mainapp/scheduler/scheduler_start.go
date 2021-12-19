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
	// Get pipeline schedule from DB
	schedule, err := getPipelineSchedule()
	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return err
	}

	// Initialize the scheduler
	s := gocron.NewScheduler(time.UTC)

	// Frequent Jobs
	// For seconds, minutes and hours. Consumes simple gocron strings; 30s, 10m, 5h
	if strings.Contains(schedule, "SECONDLY") ||
		strings.Contains(schedule, "MINUTELY") ||
		strings.Contains(schedule, "HOURLY") {

		log.Println("Gocron string: ", schedule)

		gocronString, err := rruleToGocron(schedule)
		if err != nil {
			if os.Getenv("debug") == "true" {
				logging.PrintSecretsRedact(err)
			}
			return err
		}

		// Set the job
		_, err = s.Every(gocronString).Tag("Frequent Jobs").Do(func() {
			job, nextRun := s.NextRun()
			tags := strings.Join(job.Tags(), ", ")

			// Printed at each iteration
			log.Println(tags+": Published at (every ...): ", time.Now())
			fmt.Println(tags+": The next run:", nextRun)
			fmt.Println(tags+": Run count:", job.RunCount())
			fmt.Println(tags+": Is running?:", job.IsRunning())
			fmt.Println(tags+": Last run:", job.LastRun())
			fmt.Println(tags+": Next run:", job.NextRun())
			fmt.Println(tags+": Tag:", job.Tags())
		})
		if err != nil {
			if os.Getenv("debug") == "true" {
				logging.PrintSecretsRedact(err)
			}
			return err
		}

		// Start the job
		s.StartAsync()

		// Get time for the next run
		_, t := s.NextRun()

		// Printed once in the beginning
		fmt.Println("Main: The next run: ", t)

		// Occasional Jobs
		// For time units longer than hour. Consumes cron strings; 0 0 1 ? * 1
	} else {
		log.Println("Rrule: ", schedule)

		cronString, err := utilities.Rtoc(schedule, utilities.Config{IncludeYear: false})
		if err != nil {
			if os.Getenv("debug") == "true" {
				logging.PrintSecretsRedact(err)
			}
			return err
		}

		// Set the job
		_, err = s.CronWithSeconds(cronString).Tag("Occasional Jobs").Do(func() {
			job, nextRun := s.NextRun()
			tags := strings.Join(job.Tags(), ", ")

			// Printed at each iteration
			log.Println(tags+": Published at (every ...): ", time.Now())
			fmt.Println(tags+": The next run:", nextRun)
			fmt.Println(tags+": Run count:", job.RunCount())
			fmt.Println(tags+": Is running?:", job.IsRunning())
			fmt.Println(tags+": Last run:", job.LastRun())
			fmt.Println(tags+": Next run:", job.NextRun())
			fmt.Println(tags+": Tag:", job.Tags())
		})
		if err != nil {
			if os.Getenv("debug") == "true" {
				logging.PrintSecretsRedact(err)
			}
			return err
		}

		// Start the job
		s.StartAsync()

		// Get time for the next run
		_, t := s.NextRun()

		// Printed once in the beginning
		fmt.Println("Main: The next run: ", t)
	}

	fmt.Println("Main: Number of jobs scheduled:", s.Jobs())
	fmt.Println("Main: Running:", s.IsRunning())

	return nil
}

// Takes rrule and returns gocron string ex.
//  "FREQ=SECONDLY;INTERVAL=30" => "30s"
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

func getPipelineSchedule() (string, error) {
	u := models.Pipelines{}

	err := database.DBConn.Where("active = ?", true).First(&u).Error

	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("database error")
	}

	return u.Schedule, nil
}
