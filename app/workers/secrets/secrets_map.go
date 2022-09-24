package secrets

import (
	"log"
	"os"
	"strings"

	modelmain "github.com/dataplane-app/dataplane/mainapp/database/models"
	"github.com/dataplane-app/dataplane/mainapp/utilities"

	wrkerconfig "github.com/dataplane-app/dataplane/workers/config"
	"github.com/dataplane-app/dataplane/workers/database"
)

var SecretsArray = []string{}
var Green = "\033[32m"
var Reset = "\033[0m"

/* Load the secrets for redaction on startup */
func MapSecrets() {

	SecretsArray = []string{}

	// Load the secrets attached to this worker group
	for _, e := range os.Environ() {
		pair := strings.SplitN(e, "=", 2)
		if strings.Contains(pair[0], "secret_dp_") {
			os.Unsetenv(pair[0])
		}
	}

	for _, e := range os.Environ() {
		pair := strings.SplitN(e, "=", 2)
		if strings.Contains(pair[0], "secret") {

			SecretsArray = append(SecretsArray, pair[1])
			SecretsArray = append(SecretsArray, Green+"** Secret **"+Reset)
		}

	}

	// Retrieve the secrets attached to this worker group
	var loadsecrets []*modelmain.Secrets
	if err := database.DBConn.Raw(`
	select
	s.env_var,
	s.secret,
	s.value
	from
	secrets s, worker_secrets ws 
	where 
	s.secret = ws.secret_id and
	s.environment_id = ws.environment_id and
	ws.active = true and
	s.active = true and
	ws.worker_group_id = ? and
	s.environment_id = ? and
	s.secret_type='custom'
	`, wrkerconfig.WorkerGroup, wrkerconfig.EnvID).Scan(&loadsecrets).Error; err != nil {
		log.Println("DB: Could not load secret")
	}

	for _, e := range loadsecrets {

		decryptValue, _ := utilities.Decrypt(e.Value)
		os.Setenv(e.EnvVar, decryptValue)
		SecretsArray = append(SecretsArray, decryptValue)
		SecretsArray = append(SecretsArray, Green+"** Secret **"+Reset)

	}

	// log.Println("Secrets array :", len(SecretsArray), SecretsArray)
	// The replacer is comma separated first is key then replacement - that is why append is twice above
	wrkerconfig.Secrets = strings.NewReplacer(SecretsArray...)
	log.Println("🐿  Secrets loaded")

}
