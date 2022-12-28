package configascode

import (
	"fmt"
	"log"

	"github.com/dataplane-app/dataplane/app/mainapp/database/models"
	"gopkg.in/yaml.v3"
)

func CreateNewYAML(pipeline models.Pipelines) {

	var s = PipeineYAML{}

	s.Kind = "Dataplane/pipeline/v1"
	s.Version = "0.0.1"

	yamlData, err := yaml.Marshal(&s)

	if err != nil {
		fmt.Printf("Error while Marshaling. %v", err)
	}

	log.Println(string(yamlData))

}
