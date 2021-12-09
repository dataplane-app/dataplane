package logme

import (
	"dataplane/database"
	"dataplane/database/models"
	"dataplane/logging"
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
)

/*
Platform logger test
Writes logs for the platform
go test -timeout 30s -count=1 -v -run ^TestPlatformLoggerFunction$ dataplane/logme
*/
func TestPlatformLoggerFunction(t *testing.T) {

	database.DBConnect()
	logging.MapSecrets()
	success := PlatformLogger(models.LogsPlatform{
		Environment: "test_environment",
		Category:    "test_category",
		LogType:     "error", //can be error, info or debug
		Log:         os.Getenv("secret_db_host") + " - Test log",
	})

	assert.Equalf(t, true, success, "Platform log.")

}
