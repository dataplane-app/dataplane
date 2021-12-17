package main

import (
	"crypto/sha256"
	"dataplane/database"
	"dataplane/database/models"
	"dataplane/logging"
	pipelines "dataplane/pipelines/components"
	"dataplane/utilities"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"strings"
	"time"

	"github.com/google/uuid"
	"gopkg.in/yaml.v2"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

func main() {
	database.DBConnect()
	logging.MapSecrets()
	LoadAllYAML(os.Getenv("dataplane_code_folder"))
}

type PipelinesOutcomes struct {
	Name    string
	Version string
	Outcome string
}

func LoadAllYAML(path string) {
	// var paths []string
	start := time.Now()
	paths, _ := utilities.GetYAMLPaths(path)

	c := make(chan PipelinesOutcomes)

	for _, path := range paths {
		// paths = append(paths, p)
		go LoadSingleYAML(path, c)

	}

	// Collect outcomes from go routines
	outcomes := make([]PipelinesOutcomes, len(paths))
	for i, _ := range outcomes {
		outcomes[i] = <-c
	}

	stop := time.Now()
	ms := float32(stop.Sub(start)) / float32(time.Millisecond)
	log.Println(fmt.Sprintf("Load file duration: %f", ms), "ms")

}

func LoadSingleYAML(path string, c chan PipelinesOutcomes) (result string, err error) {

	b, err := ioutil.ReadFile(path)
	if err != nil {
		logging.PrintSecretsRedact("An error occurred reading file:", path)
	}

	// Unmarshal the YAML
	pipeline := pipelines.PipelineYAML{}
	err = yaml.Unmarshal(b, &pipeline)
	if err != nil {
		logging.PrintSecretsRedact("error: %v", err)
	}

	// Filter ouy any yamls that aren't pipelines
	if pipeline.Kind != "Pipeline" {

	}

	// Load all existing pipelines
	var existingPipeline models.Pipelines

	// Get any existing pipelines with same name - name needs to be unique
	err = database.DBConn.Select("name", "version", "yaml_hash").Where("name = ?", pipeline.Metadata.Name).First(&existingPipeline).Error
	if err != nil {
		if err != gorm.ErrRecordNotFound {
			logging.PrintSecretsRedact(err)
		} else {
			// New  pipeline found
			logging.PrintSecretsRedact("New pipeline found:", pipeline.Metadata.Name, pipeline.Metadata.Version)
		}
	}

	// Get the 256 hash of the file
	// sh := fmt.Sprintf("%x", sha256.Sum256(b))
	pipeline.Metadata.SHA256 = fmt.Sprintf("%x", sha256.Sum256(b))

	if existingPipeline.Name == pipeline.Metadata.Name {

		// Version already exists
		if pipeline.Metadata.Version == existingPipeline.Version {
			if pipeline.Metadata.SHA256 == existingPipeline.YAMLHash {
				// File has not changed
				logging.PrintSecretsRedact(pipeline.Metadata.Name, pipeline.Metadata.Version, "already exists")
			} else {
				// File has changedd
				logging.PrintSecretsRedact(pipeline.Metadata.Name, pipeline.Metadata.Version, "already exists. Yaml changed, bump the version to update.")

			}
			log.Println("Skipping...")
			c <- PipelinesOutcomes{
				Name:    pipeline.Metadata.Name,
				Version: pipeline.Metadata.Version,
				Outcome: "skip",
			}
			return "skip", nil
		}

	}

	// ---- Marshal to json
	res2B, _ := json.Marshal(pipeline)
	// fmt.Println("json:", string(res2B))

	var filejson datatypes.JSON
	filejson.UnmarshalJSON(res2B)
	dbPipeline := models.Pipelines{
		PipelineID:   uuid.NewString(),
		Name:         pipeline.Metadata.Name,
		Version:      pipeline.Metadata.Version,
		YAMLHash:     pipeline.Metadata.SHA256,
		Description:  pipeline.Metadata.Description,
		Active:       pipeline.Spec.Active,
		FileJSON:     filejson,
		Current:      "current",
		Schedule:     pipeline.Spec.Schedule,
		ScheduleType: pipeline.Spec.ScheduleType,
	}

	err = database.DBConn.Exec("update pipelines set current='history', active=false, online=false where name =? and version <> ? and current = 'current'", pipeline.Metadata.Name, pipeline.Metadata.Version).Error
	if err != nil {
		logging.PrintSecretsRedact("Disable old version failed - ", err)
	}

	err = database.DBConn.Create(&dbPipeline).Error
	if err != nil {
		if strings.Contains(err.Error(), `violates unique constraint "idx_pipelines"`) {
			logging.PrintSecretsRedact(dbPipeline.Name, dbPipeline.Version, "already exists, bump the version to update.")
		} else {
			logging.PrintSecretsRedact(err)
		}
	} else {
		logging.PrintSecretsRedact("Loaded file: ", path)
	}

	c <- PipelinesOutcomes{
		Name:    pipeline.Metadata.Name,
		Version: pipeline.Metadata.Version,
		Outcome: "done",
	}

	return "done", nil

}
