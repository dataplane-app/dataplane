package logme

import (
	"dataplane/mainapp/database"
	"dataplane/mainapp/database/models"
	"dataplane/mainapp/logging"
	"dataplane/mainapp/utilities"
)

/*
Platform logger
Writes logs for the platform
*/
func PlatformLogger(input models.LogsPlatform) bool {

	/* Validate log type */
	if !(utilities.InArray(input.LogType, []string{"error", "info", "debug"})) {
		panic("log error type")
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
