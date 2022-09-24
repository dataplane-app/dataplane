package logme

import (
	"errors"
	"os"
	"testing"

	"github.com/dataplane-app/dataplane/mainapp/database"
	"github.com/dataplane-app/dataplane/mainapp/database/migrations"
	"github.com/dataplane-app/dataplane/mainapp/database/models"
	"github.com/dataplane-app/dataplane/mainapp/logging"

	"github.com/stretchr/testify/assert"
)

/*
Platform logger test
Writes logs for the platform
go test -timeout 30s -count=1 -v -run ^TestPlatformLoggerFunction$ dataplane/logme
*/
func TestPlatformLoggerFunction(t *testing.T) {

	database.DBConnect()
	migrations.Migrate()
	logging.MapSecrets()
	err := errors.New("Something is wrong - " + os.Getenv("secret_db_host"))
	success := PlatformLogger(models.LogsPlatform{
		EnvironmentID: "test_environment",
		Category:      "test_category",
		LogType:       "error", //can be error, info or debug
		Log:           os.Getenv("secret_db_host") + " - Test log",
		ErrorMsg:      err.Error(),
	})

	assert.Equalf(t, true, success, "Platform log.")

}
