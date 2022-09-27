package tests

import (
	"log"
	"os"
	"testing"

	"github.com/dataplane-app/dataplane/app/mainapp/database"
	wrkerconfig "github.com/dataplane-app/dataplane/app/workers/config"
	"github.com/dataplane-app/dataplane/app/workers/secrets"

	"github.com/stretchr/testify/assert"
)

/*
Run Super secret squirrel function test
go test -timeout 30s -v -run ^TestSecretsRedact$ dataplane/logging
*/
func TestSecretsRedactFunction(t *testing.T) {

	database.DBConnect()

	// Create some secrets
	os.Setenv("secret_super", "squirrel")

	logmessage := "The grey squirrel is plentiful in wooded districts."

	// load up the secrets
	secrets.MapSecrets()

	redacted := wrkerconfig.Secrets.Replace(logmessage)

	log.Println("Test removal: ", redacted)

	assert.Equalf(t, "The grey \033[32m** Secret **\033[0m is plentiful in wooded districts.", redacted, "Secret redaction failed.")

}
