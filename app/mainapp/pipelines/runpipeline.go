package pipelines

import (
	"encoding/json"
	"log"
	"time"

	dpconfig "github.com/dataplane-app/dataplane/app/mainapp/config"
	"github.com/dataplane-app/dataplane/app/mainapp/database"
	"github.com/dataplane-app/dataplane/app/mainapp/database/models"
	"github.com/dataplane-app/dataplane/app/mainapp/logging"
	"github.com/dataplane-app/dataplane/app/mainapp/messageq"
	"github.com/dataplane-app/dataplane/app/mainapp/worker"

	"github.com/google/uuid"
)

type Command struct {
	Command string `json:command`
}

func RunPipeline(pipelineID string, environmentID string, runID string) (models.PipelineRuns, error) {

	// start := time.Now().UTC()

	// Doesnt require concurrency safety, should be written / read in sequence.
	// var destinations = make(map[string][]string)
	// var dependencies = make(map[string][]string)
	var triggerData = make(map[string]*models.WorkerTasks)

	// Retrieve pipeline details
	pipelinedata := models.Pipelines{}
	err := database.DBConn.Select("pipeline_id", "name", "worker_group", "json").Where("pipeline_id = ? and environment_id =?", pipelineID, environmentID).First(&pipelinedata).Error
	if err != nil {

		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return models.PipelineRuns{}, err
	}

	// Input data from trigger
	var inputData bool = false

	// Create a run
	run := models.PipelineRuns{
		RunID:         runID,
		PipelineID:    pipelineID,
		Status:        "Running",
		EnvironmentID: environmentID,
		CreatedAt:     time.Now().UTC(),
		RunJSON:       pipelinedata.Json,
		RunType:       "pipeline",
		InputData:     inputData,
	}

	err = database.DBConn.Create(&run).Error
	if err != nil {

		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return models.PipelineRuns{}, err
	}

	// ------ Obtain folders
	// folders := make(chan []models.CodeFolders)
	// // parentfolder := make(chan string)
	// foldersdata := []models.CodeFolders{}

	// go func() {
	// 	database.DBConn.Where("pipeline_id = ? and environment_id =? and level = ?", pipelineID, environmentID, "node").Find(&foldersdata)
	// 	folders <- foldersdata

	// 	// pf := ""

	// 	// if len(foldersdata) > 0 {
	// 	// 	pf, _ = filesystem.FolderConstructByID(database.DBConn, foldersdata[0].ParentID, environmentID, "pipelines")
	// 	// }
	// 	// parentfolder <- pf
	// }()

	// Chart a course
	nodes := make(chan []*models.PipelineNodes)
	nodesdata := []*models.PipelineNodes{}

	go func() {

		database.DBConn.Where("pipeline_id = ? and environment_id =?", pipelineID, environmentID).Find(&nodesdata)
		nodes <- nodesdata
	}()

	// edges := make(chan []*models.PipelineEdges)
	// edgesdata := []*models.PipelineEdges{}
	// go func() {
	// 	database.DBConn.Select("from", "to").Where("pipeline_id = ? and environment_id =?", pipelineID, environmentID).Find(&edgesdata)
	// 	edges <- edgesdata
	// }()

	// Start at trigger
	RunID := run.RunID

	// log.Println("Run ID:", RunID)

	// Return go routines
	nodesdata = <-nodes
	// edgesdata = <-edges
	// foldersdata = <-folders
	// parentfolderdata := environmentID + "/pipelines/" + pipelineID
	// <-parentfolder

	// The folder structure will look like <environment ID>/pipelines/<pipeline ID>
	// log.Println("parent folder", parentfolderdata)

	// Map children
	// for _, s := range edgesdata {

	// 	destinations[s.From] = append(destinations[s.From], s.To)
	// 	dependencies[s.To] = append(dependencies[s.To], s.From)

	// }

	// Map folder structure:
	// var folderMap = make(map[string]string)
	// var folderNodeMap = make(map[string]string)
	// for _, f := range foldersdata {

	// 	if f.Level == "node" {

	// 		dir := parentfolderdata + f.NodeID
	// 		// + "/" + f.FolderID
	// 		// + "_" + f.FolderName
	// 		// log.Println("Dir:", dir)

	// 		folderMap[f.NodeID] = dir

	// 		// ---- The Folder ID is needed to see the root of the folder structure, otherwise it must recursively go through the folder leves that are not root.
	// 		folderNodeMap[f.NodeID] = f.FolderID
	// 		if dpconfig.Debug == "true" {
	// 			if _, err := os.Stat(dpconfig.CodeDirectory + dir); os.IsExist(err) {
	// 				log.Println("Dir exists:", dpconfig.CodeDirectory+dir)

	// 			}
	// 		}

	// 	}

	// }

	var course []*models.WorkerTasks
	var trigger []string
	var triggerID string
	var status string
	var nodeType string
	var workergroup string
	var startTask *models.WorkerTasks

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
				if dpconfig.Debug == "true" {
					logging.PrintSecretsRedact(err)
				}
			}
			status = "Success"
			triggerID = s.NodeID
		}

		// dependJSON, err := json.Marshal(dependencies[s.NodeID])
		// if err != nil {
		// 	logging.PrintSecretsRedact(err)
		// }

		// destinationJSON, err := json.Marshal(destinations[s.NodeID])
		// if err != nil {
		// 	logging.PrintSecretsRedact(err)
		// }

		addTask := &models.WorkerTasks{
			TaskID:        uuid.NewString(),
			CreatedAt:     time.Now().UTC(),
			EnvironmentID: environmentID,
			RunID:         RunID,
			WorkerGroup:   workergroup,
			WorkerType:    s.NodeTypeDesc,
			PipelineID:    s.PipelineID,
			NodeID:        s.NodeID,
			Status:        status,
			Dependency:    s.Dependency,
			Commands:      s.Commands,
			Destination:   s.Destination,
			// Folder:        folderMap[s.NodeID],
			// FolderID:      folderNodeMap[s.NodeID],
			RunType: "pipeline",
		}

		if nodeType == "start" {

			addTask.StartDT = time.Now().UTC()
			addTask.EndDT = time.Now().UTC()
			startTask = addTask

		}

		// This is to queue the tasks for run - sends Queue status to frontend
		errnat := messageq.MsgSend("taskupdate."+environmentID+"."+RunID, addTask)
		if errnat != nil {
			if dpconfig.Debug == "true" {
				log.Println(errnat)
			}

		}

		/* attach addTask to triggerData */
		triggerData[s.NodeID] = addTask

		course = append(course, addTask)

	}

	err = database.DBConn.Create(&course).Error
	if err != nil {
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return models.PipelineRuns{}, err
	}

	// --- Run the first set of tasks
	if dpconfig.Debug == "true" {
		log.Println("trigger: ", trigger, triggerID)
	}

	// ---------- Run the first set of dependencies ----------

	// send message that trigger node has run - for front end websockets
	errnat := messageq.MsgSend("taskupdate."+environmentID+"."+RunID, startTask)
	if errnat != nil {
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(errnat)
		}

	}

	for _, s := range trigger {

		commandsJson := []Command{}
		commandsend := []string{}

		json.Unmarshal(triggerData[s].Commands, &commandsJson)

		// x = x + 1
		for _, c := range commandsJson {
			commandsend = append(commandsend, c.Command)
		}

		/* Start the first task */
		err = worker.WorkerRunTask(triggerData[s].WorkerGroup, triggerData[s].TaskID, RunID, environmentID, pipelineID, s, commandsend, "", "pipeline", triggerData[s].WorkerType, inputData)
		if err != nil {
			if dpconfig.Debug == "true" {
				logging.PrintSecretsRedact(err)
			}
			return run, err
		} else {
			if dpconfig.Debug == "true" {
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
