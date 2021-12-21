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

func SchedulerStart() (time.Time, error) {
	// Get pipeline schedule from DB
	schedule, err := getPipelineSchedule()
	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return time.Now(), err
	}

	// Initialize the scheduler
	s := gocron.NewScheduler(time.UTC)

	var nextRun time.Time

	// Frequent Jobs
	// For seconds, minutes and hours. Consumes simple gocron strings; 30s, 10m, 5h
	if strings.Contains(schedule, "SECONDLY") ||
		strings.Contains(schedule, "MINUTELY") ||
		strings.Contains(schedule, "HOURLY") {

		gocronString, err := rruleToGocron(schedule)
		if err != nil {
			if os.Getenv("debug") == "true" {
				logging.PrintSecretsRedact(err)
			}
			return time.Now(), err
		}
		fmt.Println("Rrule: ", schedule)
		fmt.Println("Gocron string: ", gocronString)

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
			return time.Now(), err
		}

		// Start the job
		s.StartAsync()

		// Get time for the next run
		_, nextRun = s.NextRun()

		// Printed once in the beginning
		fmt.Println("Main: The next run: ", nextRun)

		// Occasional Jobs
		// For time units longer than hour. Consumes cron strings; 0 0 1 ? * 1
	} else {
		cronString, err := utilities.Rtoc(schedule, utilities.Config{IncludeYear: false})
		if err != nil {
			if os.Getenv("debug") == "true" {
				logging.PrintSecretsRedact(err)
			}
			return time.Now(), err
		}
		fmt.Println("Rrule: ", schedule)
		fmt.Println("Cron string: ", cronString)

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
			return time.Now(), err
		}

		// Start the job
		s.StartAsync()

		// Get time for the next run
		_, t := s.NextRun()

		// Printed once in the beginning
		fmt.Println("Main: The next run: ", t)
	}

	fmt.Println("Main: Number of jobs scheduled:", len(s.Jobs()))
	fmt.Println("Main: Running:", s.IsRunning())

	return nextRun, nil
}

// Takes rrule and returns gocron string;
//  "FREQ=SECONDLY;INTERVAL=30" => "30s"
func rruleToGocron(rule string) (gocronRule string, Err error) {

	// Extract interval value
	re := regexp.MustCompile(`INTERVAL=(\d+)`)
	output := re.FindStringSubmatch((rule))
	interval := output[1]

	// Extract frequency value
	re = regexp.MustCompile(`FREQ=(\w+)`)
	output = re.FindStringSubmatch((rule))
	freq := output[1]
	freqFirstLetter := strings.ToLower(freq[:1])

	gocronRule = interval + freqFirstLetter

	return gocronRule, nil
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
