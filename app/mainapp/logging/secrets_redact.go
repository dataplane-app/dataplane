package logging

import (
	"fmt"
	"log"
	"os"
	"strings"
)

var Secrets *strings.Replacer
var SecretsArray = []string{}
var Green = "\033[32m"
var Reset = "\033[0m"

func PrintSecretsRedact(logmessages ...interface{}) {

	// 	Secrets.Replace(logmessages...)
	var printString string
	for _, n := range logmessages {
		printString = printString + fmt.Sprintf("%s ", n)

	}

	log.Println(Secrets.Replace(printString))
}

/* Load the secrets for redaction on startup */
func MapSecrets() {

	for _, e := range os.Environ() {
		pair := strings.SplitN(e, "=", 2)
		if strings.Contains(pair[0], "secret") && pair[1] != "" {
			SecretsArray = append(SecretsArray, pair[1])
			SecretsArray = append(SecretsArray, Green+"** Secret **"+Reset)
		}

	}

	// The replacer is comma separated first is key then replacement - that is why append is twice above
	Secrets = strings.NewReplacer(SecretsArray...)

}
