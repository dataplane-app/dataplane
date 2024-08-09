package logme

import (
	"log"

	"github.com/dataplane-app/dataplane/app/mainapp/database"
	"github.com/dataplane-app/dataplane/app/mainapp/database/models"
	"github.com/dataplane-app/dataplane/app/mainapp/logging"
	"github.com/dataplane-app/dataplane/app/mainapp/utilities"
)

/*
Platform logger
Writes logs for the platform
*/
func PlatformLogger(input models.LogsPlatform) bool {

	/* Validate log type */
	if !(utilities.InArray(input.LogType, []string{"error", "info", "debug"})) {
		log.Println("PlatformLogger: log error type")
		return false
	}

	/* Remove secrets */
	input.Log = logging.Secrets.Replace(input.Log)
	input.ErrorMsg = logging.Secrets.Replace(input.ErrorMsg)

	/* Write to database */
	err := database.DBConn.Create(&input).Error
	if err != nil {
		logging.PrintSecretsRedact(err)
		logging.PrintSecretsRedact(input.LogType, input.EnvironmentID, input.Log)
		return false
	}
	return true
}
