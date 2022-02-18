package main

import (
	"dataplane/mainapp/database"
	"dataplane/mainapp/database/models"
	"encoding/json"
	"fmt"
	"log"

	"github.com/google/uuid"
)

func main() {

	database.DBConnect()

	var destinations = make(map[string][]string)
	var dependencies = make(map[string][]string)

	pipelineID := "b55032a5-c8a1-4e70-93cb-d76b9370b75a"

	// Chart a course
	nodes := []*models.PipelineNodes{}
	database.DBConn.Where("pipeline_id = ?", pipelineID).Find(&nodes)

	edges := []*models.PipelineEdges{}
	database.DBConn.Where("pipeline_id = ?", pipelineID).Find(&edges)

	// Start at trigger
	RunID := uuid.NewString()

	log.Println("Run ID:", RunID)

	// Map children
	for _, s := range edges {

		destinations[s.From] = append(destinations[s.From], s.To)
		dependencies[s.To] = append(dependencies[s.To], s.From)

	}

	log.Println(" -> ", destinations)
	log.Println(" -> ", dependencies)

	jsonString, err := json.Marshal(destinations)
	fmt.Println(string(jsonString), err)

}
