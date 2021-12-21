package pipelines

import (
	"dataplane/database"
	"dataplane/database/models"
	"dataplane/logging"
	"dataplane/scheduler"
	"os"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

type TestCase struct {
	rrule            string
	expectedDuration time.Duration
}

var testCases = []TestCase{
	{
		rrule:            "FREQ=SECONDLY;INTERVAL=10",
		expectedDuration: 10 * time.Second,
	}, {
		rrule:            "FREQ=SECONDLY;INTERVAL=15",
		expectedDuration: 15 * time.Second,
	},
}

/*
For individual tests - in separate window run: go run server.go
go test -p 1 -v -count=1 -run TestSchedulerStart dataplane/Tests/pipelines
* Test scheduler
*/
func TestSchedulerStart(t *testing.T) {
	database.DBConnect()

	// Get rule of active schedule; to be restored after the test
	e := models.Pipelines{}
	err := database.DBConn.Where("active = ?", true).Find(&e).Error
	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		t.Log(err)
	}
	activeSchedule := e.Schedule

	// Loop through all test cases
	for _, c := range testCases {
		// Update the database with test case rrule
		err := database.DBConn.Where("active = ?", true).Updates(models.Pipelines{
			Schedule: c.rrule,
		}).Error
		if err != nil {
			if os.Getenv("debug") == "true" {
				logging.PrintSecretsRedact(err)
			}
			t.Log(err)
		}

		// Get the time calculated for the next run per SchedulerStart function
		nextRun, _ := scheduler.SchedulerStart()

		var timeUntilNextRun time.Duration = time.Until(nextRun)

		t.Log("Rule from DB: ", c.rrule)
		t.Log("True time until next run: ", timeUntilNextRun)
		t.Log("Rounded time until next run: ", timeUntilNextRun.Round(time.Millisecond))
		t.Log("Expected duration:           ", c.expectedDuration)
		t.Log("Expected duration match    :", timeUntilNextRun.Round(time.Millisecond) == c.expectedDuration)
		assert.Equalf(t, timeUntilNextRun.Round(time.Millisecond), c.expectedDuration, "Expected duration until next run doesn't match")

	}

	// Restore original schedule in DB
	err = database.DBConn.Where("active = ?", true).Updates(models.Pipelines{
		Schedule: activeSchedule,
	}).Error
	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		t.Log(err)
	}
}
