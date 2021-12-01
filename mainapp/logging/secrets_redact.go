package logging

import (
	"os"
	"strings"
)

var Secrets *strings.Replacer
var SecretsArray = []string{}
var Green = "\033[32m"
var Reset = "\033[0m"

func PrintSecretsRedact(logmessages ...interface{}) {

	// 	Secrets.Replace(logmessages...)
	// log.Println()
}

/* Load the secrets for redaction on startup */
func MapSecrets() {

	for _, e := range os.Environ() {
		pair := strings.SplitN(e, "=", 2)
		if strings.Contains(pair[0], "secret") {
			SecretsArray = append(SecretsArray, pair[1])
			SecretsArray = append(SecretsArray, Green+"** Secret:"+pair[0]+" **"+Reset)
		}

	}

	Secrets = strings.NewReplacer(SecretsArray...)

}
