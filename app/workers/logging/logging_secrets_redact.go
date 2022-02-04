package logging

import (
	"dataplane/workers/config"
	"fmt"
	"log"
)

func PrintSecretsRedact(logmessages ...interface{}) {

	// 	Secrets.Replace(logmessages...)
	var printString string
	for _, n := range logmessages {
		printString = printString + fmt.Sprintf("%s ", n)

	}

	log.Println(config.Secrets.Replace(printString))
}
