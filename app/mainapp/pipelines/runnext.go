package pipelines

import (
	"dataplane/mainapp/config"
	"dataplane/mainapp/database/models"
	"dataplane/mainapp/logging"
	"dataplane/mainapp/messageq"
	"log"
)

func RunNextPipeline() {

	_, err := messageq.NATSencoded.QueueSubscribe("pipeline-run-next", "runnext", func(subj, reply string, msg models.WorkerTaskSend) {

		log.Println(msg)
		// Retrieve all destinations

		// Retrieve all dependencies

	})

	if err != nil {
		if config.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}

	}

	// start := time.Now().UTC()

	// var destinations = make(map[string][]string)
	// var dependencies = make(map[string][]string)
	// var triggerData = make(map[string]*models.WorkerTasks)

	// environmentID := "Testing"

	// // Create a run
	// run := models.PipelineRuns{
	// 	RunID:         uuid.NewString(),
	// 	PipelineID:    pipelineID,
	// 	Status:        "Running",
	// 	EnvironmentID: environmentID,
	// 	CreatedAt:     time.Now().UTC(),
	// }

	// err := database.DBConn.Create(&run).Error
	// if err != nil {

	// 	if config.Debug == "true" {
	// 		logging.PrintSecretsRedact(err)
	// 	}
	// 	return err
	// }

	// // Chart a course
	// nodes := make(chan []*models.PipelineNodes)
	// nodesdata := []*models.PipelineNodes{}

	// go func() {
	// 	database.DBConn.Where("pipeline_id = ?", pipelineID).Find(&nodesdata)
	// 	nodes <- nodesdata
	// }()

	// edges := make(chan []*models.PipelineEdges)
	// edgesdata := []*models.PipelineEdges{}
	// go func() {
	// 	database.DBConn.Where("pipeline_id = ?", pipelineID).Find(&edgesdata)
	// 	edges <- edgesdata
	// }()

	// // Start at trigger
	// RunID := run.RunID

	// log.Println("Run ID:", RunID)

	// // Return go routines
	// nodesdata = <-nodes
	// edgesdata = <-edges

	// // Map children
	// for _, s := range edgesdata {

	// 	destinations[s.From] = append(destinations[s.From], s.To)
	// 	dependencies[s.To] = append(dependencies[s.To], s.From)

	// }

	// var course []*models.WorkerTasks
	// var trigger []string
	// var triggerID string
	// var status string

	// for _, s := range nodesdata {

	// 	status = "Queue"

	// 	if s.Commands == nil {
	// 		log.Println("no commands")
	// 	}

	// 	// Get the first trigger and route
	// 	log.Println("node type", s.NodeType, s.Destination)
	// 	if s.NodeType == "playNode" {

	// 		err = json.Unmarshal(s.Destination, &trigger)
	// 		if err != nil {
	// 			if config.Debug == "true" {
	// 				logging.PrintSecretsRedact(err)
	// 			}
	// 		}
	// 		status = "Success"
	// 		triggerID = s.NodeID
	// 	}

	// 	addTask := &models.WorkerTasks{
	// 		TaskID:        uuid.NewString(),
	// 		CreatedAt:     time.Now().UTC(),
	// 		EnvironmentID: environmentID,
	// 		RunID:         RunID,
	// 		WorkerGroup:   s.WorkerGroup,
	// 		PipelineID:    s.PipelineID,
	// 		NodeID:        s.NodeID,
	// 		Status:        status,
	// 	}

	// 	triggerData[s.NodeID] = addTask

	// 	course = append(course, addTask)

	// }

	// err = database.DBConn.Create(&course).Error
	// if err != nil {
	// 	if config.Debug == "true" {
	// 		logging.PrintSecretsRedact(err)
	// 	}
	// 	return err
	// }

	// // --- Run the first set of tasks
	// log.Println("trigger: ", trigger, triggerID)
	// for _, s := range trigger {

	// 	log.Println("First:", s)
	// 	err = worker.WorkerRunTask("python_1", triggerData[s].TaskID, RunID, environmentID, "", "", []string{"echo " + s})
	// 	if err != nil {
	// 		if config.Debug == "true" {
	// 			logging.PrintSecretsRedact(err)
	// 		}
	// 		return err
	// 	} else {
	// 		if config.Debug == "true" {
	// 			logging.PrintSecretsRedact(triggerData[s].TaskID)
	// 		}
	// 	}

	// }

	// // log.Println(" -> ", destinations)
	// // log.Println(" -> ", dependencies)

	// // jsonString, err := json.Marshal(destinations)
	// // fmt.Println(string(jsonString), err)

	// stop := time.Now()
	// // Do something with response
	// log.Println("🐆 Run time:", fmt.Sprintf("%f", float32(stop.Sub(start))/float32(time.Millisecond))+"ms")

	// return nil

}
