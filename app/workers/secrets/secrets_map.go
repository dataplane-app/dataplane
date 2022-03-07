package secrets

import (
	modelmain "dataplane/mainapp/database/models"
	"dataplane/mainapp/utilities"
	"dataplane/workers/config"
	"dataplane/workers/database"
	"log"
	"os"
	"strings"
)

var SecretsArray = []string{}
var Green = "\033[32m"
var Reset = "\033[0m"

/* Load the secrets for redaction on startup */
func MapSecrets() {

	// Load the secrets attached to this worker group
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
	s.secret,
	s.value
	from
	secrets s, worker_secrets ws 
	where 
	s.secret = ws.secret_id and
	ws.active = true and
	s.active = true and
	ws.worker_group_id = ? and
	s.environment_id = ? and
	s.secret_type='custom'
	`, config.WorkerGroup, config.EnvID).Scan(&loadsecrets).Error; err != nil {
		log.Println("DB: Could not load secret")
	}

	for _, e := range loadsecrets {

		decryptValue, _ := utilities.Decrypt(e.Value)
		os.Setenv("secret_dp_"+strings.ToLower(e.Secret), decryptValue)
		SecretsArray = append(SecretsArray, decryptValue)
		SecretsArray = append(SecretsArray, Green+"** Secret **"+Reset)

		log.Println(config.EnvID, "Secrets: ", "secret_dp_"+strings.ToLower(e.Secret), decryptValue)

	}
	// The replacer is comma separated first is key then replacement - that is why append is twice above
	config.Secrets = strings.NewReplacer(SecretsArray...)
	log.Println("🐿  Secrets loaded")

}
