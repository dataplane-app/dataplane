package logging

import (
	"log"
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
)

/*
Run Super secret squirrel test
go test -timeout 30s -v -run ^TestSecretsRedact$ dataplane/logging
*/
func TestSecretsRedact(t *testing.T) {

	// Create some secrets
	os.Setenv("secret.super", "squirrel")

	logmessage := "The grey squirrel is plentiful in wooded districts."

	// load up the secrets
	MapSecrets()

	redacted := Secrets.Replace(logmessage)

	log.Println("Test removal: ", redacted)

	assert.Equalf(t, "The grey \033[32m** Secret:secret.super **\033[0m is plentiful in wooded districts.", redacted, "Secret redaction failed.")

}
