package main

import (
	"dataplane/mainapp/config"
	"dataplane/mainapp/database"
	"dataplane/mainapp/database/models"
	"dataplane/mainapp/logging"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
)

func main() {

	database.DBConnect()

	start := time.Now().UTC()

	var destinations = make(map[string][]string)
	var dependencies = make(map[string][]string)

	pipelineID := "b55032a5-c8a1-4e70-93cb-d76b9370b75a"
	environmentID := "Testing"

	// Create a run
	run := models.PipelineRuns{
		RunID:         uuid.NewString(),
		PipelineID:    pipelineID,
		Status:        "Running",
		EnvironmentID: environmentID,
		CreatedAt:     time.Now().UTC(),
	}

	err := database.DBConn.Create(&run).Error
	if err != nil {
		if config.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
	}

	// Chart a course
	nodes := make(chan []*models.PipelineNodes)
	nodesdata := []*models.PipelineNodes{}

	go func() {
		database.DBConn.Where("pipeline_id = ?", pipelineID).Find(&nodesdata)
		nodes <- nodesdata
	}()

	edges := make(chan []*models.PipelineEdges)
	edgesdata := []*models.PipelineEdges{}
	go func() {
		database.DBConn.Where("pipeline_id = ?", pipelineID).Find(&edgesdata)
		edges <- edgesdata
	}()

	// Start at trigger
	RunID := uuid.NewString()

	log.Println("Run ID:", RunID)

	// Return go routines
	nodesdata = <-nodes
	edgesdata = <-edges

	// Map children
	for _, s := range edgesdata {

		destinations[s.From] = append(destinations[s.From], s.To)
		dependencies[s.To] = append(dependencies[s.To], s.From)

	}

	var course []*models.WorkerTasks

	for _, s := range nodesdata {

		course = append(course, &models.WorkerTasks{
			TaskID:        uuid.NewString(),
			CreatedAt:     time.Now().UTC(),
			EnvironmentID: environmentID,
			RunID:         RunID,
			WorkerGroup:   s.WorkerGroup,
			PipelineID:    s.PipelineID,
			NodeID:        s.NodeID,
			Status:        "Queue",
		})

	}

	err = database.DBConn.Create(&course).Error
	if err != nil {
		if config.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
	}

	log.Println(" -> ", destinations)
	log.Println(" -> ", dependencies)

	jsonString, err := json.Marshal(destinations)
	fmt.Println(string(jsonString), err)

	stop := time.Now()
	// Do something with response
	log.Println("🐆 Run time:", fmt.Sprintf("%f", float32(stop.Sub(start))/float32(time.Millisecond))+"ms")

}
