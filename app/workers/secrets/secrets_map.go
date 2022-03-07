package secrets

import (
	"dataplane/workers/config"
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

	// The replacer is comma separated first is key then replacement - that is why append is twice above
	config.Secrets = strings.NewReplacer(SecretsArray...)
	log.Println("🐿  Secrets loaded")

}
