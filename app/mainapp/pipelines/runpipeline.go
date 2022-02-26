package pipelines

import (
	"dataplane/mainapp/config"
	"dataplane/mainapp/database"
	"dataplane/mainapp/database/models"
	"dataplane/mainapp/logging"
	"dataplane/mainapp/worker"
	"encoding/json"
	"log"
	"time"

	"github.com/google/uuid"
)

type Command struct {
	Command string `json:command`
}

func RunPipeline(pipelineID string, environmentID string) (models.PipelineRuns, error) {

	// start := time.Now().UTC()

	var destinations = make(map[string][]string)
	var dependencies = make(map[string][]string)
	var triggerData = make(map[string]*models.WorkerTasks)

	// Retrieve pipeline details

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
		return models.PipelineRuns{}, err
	}

	// Chart a course
	nodes := make(chan []*models.PipelineNodes)
	nodesdata := []*models.PipelineNodes{}

	go func() {
		database.DBConn.Where("pipeline_id = ? and environment_id =?", pipelineID, environmentID).Find(&nodesdata)
		nodes <- nodesdata
	}()

	edges := make(chan []*models.PipelineEdges)
	edgesdata := []*models.PipelineEdges{}
	go func() {
		database.DBConn.Where("pipeline_id = ? and environment_id =?", pipelineID, environmentID).Find(&edgesdata)
		edges <- edgesdata
	}()

	pipeline := make(chan models.Pipelines)
	pipelinedata := models.Pipelines{}
	go func() {
		database.DBConn.Where("pipeline_id = ? and environment_id =?", pipelineID, environmentID).First(&pipelinedata)
		pipeline <- pipelinedata
	}()

	// Start at trigger
	RunID := run.RunID

	// log.Println("Run ID:", RunID)

	// Return go routines
	nodesdata = <-nodes
	edgesdata = <-edges
	pipelinedata = <-pipeline

	// Map children
	for _, s := range edgesdata {

		destinations[s.From] = append(destinations[s.From], s.To)
		dependencies[s.To] = append(dependencies[s.To], s.From)

	}

	var course []*models.WorkerTasks
	var trigger []string
	var triggerID string
	var status string
	var nodeType string
	var workergroup string

	for _, s := range nodesdata {

		status = "Queue"
		nodeType = "normal"

		if s.Commands == nil {
			// log.Println("no commands")
		}

		if s.WorkerGroup == "" {
			workergroup = pipelinedata.WorkerGroup
		} else {
			workergroup = s.WorkerGroup
		}

		if s.NodeType == "trigger" {
			nodeType = "start"
		}
		// Get the first trigger and route
		// log.Println("node type", s.NodeType, s.Destination)
		if nodeType == "start" {

			err = json.Unmarshal(s.Destination, &trigger)
			if err != nil {
				if config.Debug == "true" {
					logging.PrintSecretsRedact(err)
				}
			}
			status = "Success"
			triggerID = s.NodeID
		}

		dependJSON, err := json.Marshal(dependencies[s.NodeID])
		if err != nil {
			logging.PrintSecretsRedact(err)
		}

		destinationJSON, err := json.Marshal(destinations[s.NodeID])
		if err != nil {
			logging.PrintSecretsRedact(err)
		}

		addTask := &models.WorkerTasks{
			TaskID:        uuid.NewString(),
			CreatedAt:     time.Now().UTC(),
			EnvironmentID: environmentID,
			RunID:         RunID,
			WorkerGroup:   workergroup,
			PipelineID:    s.PipelineID,
			NodeID:        s.NodeID,
			Status:        status,
			Dependency:    dependJSON,
			Commands:      s.Commands,
			Destination:   destinationJSON,
		}

		if nodeType == "start" {

			addTask.StartDT = time.Now().UTC()
			addTask.EndDT = time.Now().UTC()

		}

		triggerData[s.NodeID] = addTask

		course = append(course, addTask)

	}

	err = database.DBConn.Create(&course).Error
	if err != nil {
		if config.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return models.PipelineRuns{}, err
	}

	// --- Run the first set of tasks
	if config.Debug == "true" {
		log.Println("trigger: ", trigger, triggerID)
	}

	// ---------- Run the first set of dependencies ----------

	for _, s := range trigger {

		commandsJson := []Command{}
		commandsend := []string{}

		json.Unmarshal(triggerData[s].Commands, &commandsJson)

		// x = x + 1
		for _, c := range commandsJson {
			commandsend = append(commandsend, c.Command)
		}

		// log.Println("Commands:", commandsend)

		// log.Println("First:", s)
		// if x == 2 {
		// 	ex = "exit 1;"
		// }
		// err = worker.WorkerRunTask("python_1", triggerData[s].TaskID, RunID, environmentID, pipelineID, s, []string{"sleep " + strconv.Itoa(x) + "; echo " + s})
		err = worker.WorkerRunTask(triggerData[s].WorkerGroup, triggerData[s].TaskID, RunID, environmentID, pipelineID, s, commandsend)
		if err != nil {
			if config.Debug == "true" {
				logging.PrintSecretsRedact(err)
			}
			return run, err
		} else {
			if config.Debug == "true" {
				logging.PrintSecretsRedact(triggerData[s].TaskID)
			}
		}

	}

	// log.Println(" -> ", destinations)
	// log.Println(" -> ", dependencies)

	// jsonString, err := json.Marshal(destinations)
	// fmt.Println(string(jsonString), err)

	// stop := time.Now()
	// Do something with response
	// log.Println("🐆 Run time:", fmt.Sprintf("%f", float32(stop.Sub(start))/float32(time.Millisecond))+"ms")

	return run, nil

}
