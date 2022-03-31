package pipelines

import (
	"dataplane/mainapp/code_editor/filesystem"
	"dataplane/mainapp/config"
	"dataplane/mainapp/database"
	"dataplane/mainapp/database/models"
	"dataplane/mainapp/logging"
	"dataplane/mainapp/messageq"
	"dataplane/mainapp/worker"
	"encoding/json"
	"log"
	"os"
	"time"

	"github.com/google/uuid"
)

func RunDeployment(pipelineID string, environmentID string) (models.PipelineRuns, error) {

	// start := time.Now().UTC()

	// Doesnt require concurrency safety, should be written / read in sequence.
	var destinations = make(map[string][]string)
	var dependencies = make(map[string][]string)
	var triggerData = make(map[string]*models.WorkerTasks)

	// Retrieve pipeline details
	pipelinedata := models.DeployPipelines{}
	err := database.DBConn.Where("pipeline_id = ? and environment_id =? and deploy_active=?", pipelineID, environmentID, true).First(&pipelinedata).Error
	if err != nil {

		if config.Debug == "true" {
			logging.PrintSecretsRedact("Find deployment", err)
		}
		return models.PipelineRuns{}, err
	}

	if config.Debug == "true" {
		logging.PrintSecretsRedact("Deployment run version:", pipelinedata.Version)
	}

	// Retrieve folders

	// Create a run
	run := models.PipelineRuns{
		RunID:         uuid.NewString(),
		PipelineID:    pipelineID,
		Status:        "Running",
		EnvironmentID: environmentID,
		CreatedAt:     time.Now().UTC(),
		RunJSON:       pipelinedata.Json,
		RunType:       "deployment",
		DeployVersion: pipelinedata.Version,
	}

	err = database.DBConn.Create(&run).Error
	if err != nil {

		if config.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return models.PipelineRuns{}, err
	}

	// ------ Obtain folders
	folders := make(chan []models.DeployCodeFolders)
	parentfolder := make(chan string)
	foldersdata := []models.DeployCodeFolders{}

	go func() {
		database.DBConn.Where("pipeline_id = ? and environment_id =? and level = ? and version=?", pipelineID, environmentID, "node", pipelinedata.Version).Find(&foldersdata)
		folders <- foldersdata

		pf := ""

		if len(foldersdata) > 0 {
			pf, _ = filesystem.DeployFolderConstructByID(database.DBConn, foldersdata[0].ParentID, environmentID, "deployments", foldersdata[0].Version)
		}
		parentfolder <- pf
	}()

	// Chart a course
	nodes := make(chan []*models.DeployPipelineNodes)
	nodesdata := []*models.DeployPipelineNodes{}

	go func() {

		database.DBConn.Where("pipeline_id = ? and environment_id =? and version=?", pipelineID, environmentID, pipelinedata.Version).Find(&nodesdata)
		nodes <- nodesdata
	}()

	edges := make(chan []*models.DeployPipelineEdges)
	edgesdata := []*models.DeployPipelineEdges{}
	go func() {
		database.DBConn.Where("pipeline_id = ? and environment_id =? and version = ?", pipelineID, environmentID, pipelinedata.Version).Find(&edgesdata)
		edges <- edgesdata
	}()

	// Start at trigger
	RunID := run.RunID

	// log.Println("Run ID:", RunID)

	// Return go routines
	nodesdata = <-nodes
	edgesdata = <-edges
	foldersdata = <-folders
	parentfolderdata := <-parentfolder

	// log.Println("parent folder", parentfolderdata)

	// Map children
	for _, s := range edgesdata {

		destinations[s.From] = append(destinations[s.From], s.To)
		dependencies[s.To] = append(dependencies[s.To], s.From)

	}

	// Map folder structure:
	var folderMap = make(map[string]string)
	var folderNodeMap = make(map[string]string)
	for _, f := range foldersdata {

		dir := ""

		if f.Level == "node" {

			dir = parentfolderdata + f.FolderID + "_" + f.FolderName

			log.Println("Send dir:", parentfolderdata, f.FolderID+"_"+f.FolderName, dir)
			// log.Println(dir)

			folderMap[f.NodeID] = dir
			folderNodeMap[f.NodeID] = f.FolderID
			if config.Debug == "yes" {
				if _, err := os.Stat(config.CodeDirectory + dir); os.IsExist(err) {
					log.Println("Dir exists:", config.CodeDirectory+dir)

				}
			}

		}

	}

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
			Folder:        folderMap[s.NodeID],
			FolderID:      folderNodeMap[s.NodeID],
			RunType:       "deployment",
			Version:       s.Version,
		}

		if nodeType == "start" {

			addTask.StartDT = time.Now().UTC()
			addTask.EndDT = time.Now().UTC()
			startTask = addTask

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

	// send message that trigger node has run - for websockets
	errnat := messageq.MsgSend("taskupdate."+environmentID+"."+RunID, startTask)
	if errnat != nil {
		if config.Debug == "true" {
			logging.PrintSecretsRedact(errnat)
		}

	}

	for _, s := range trigger {

		commandsJson := []Command{}
		commandsend := []string{}

		json.Unmarshal(triggerData[s].Commands, &commandsJson)

		for _, c := range commandsJson {
			commandsend = append(commandsend, c.Command)
		}

		// log.Println("Commands:", commandsend)

		// log.Println("First:", s)
		// if x == 2 {
		// 	ex = "exit 1;"
		// }
		// err = worker.WorkerRunTask("python_1", triggerData[s].TaskID, RunID, environmentID, pipelineID, s, []string{"sleep " + strconv.Itoa(x) + "; echo " + s})

		err = worker.WorkerRunTask(triggerData[s].WorkerGroup, triggerData[s].TaskID, RunID, environmentID, pipelineID, s, commandsend, folderMap[triggerData[s].NodeID], folderNodeMap[triggerData[s].NodeID], triggerData[s].Version, "deployment")
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
