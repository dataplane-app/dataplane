package logging

import (
	"dataplane/workers/config"
	"dataplane/workers/secrets"
	"log"
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
)

/*
Run Super secret squirrel function test
go test -timeout 30s -v -run ^TestSecretsRedact$ dataplane/logging
*/
func TestSecretsRedactFunction(t *testing.T) {

	// Create some secrets
	os.Setenv("secret_super", "squirrel")

	logmessage := "The grey squirrel is plentiful in wooded districts."

	// load up the secrets
	secrets.MapSecrets()

	redacted := config.Secrets.Replace(logmessage)

	log.Println("Test removal: ", redacted)

	assert.Equalf(t, "The grey \033[32m** Secret **\033[0m is plentiful in wooded districts.", redacted, "Secret redaction failed.")

}
