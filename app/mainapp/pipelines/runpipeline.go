package pipelines

import (
	"dataplane/mainapp/config"
	"dataplane/mainapp/database"
	"dataplane/mainapp/database/models"
	"dataplane/mainapp/logging"
	"dataplane/mainapp/messageq"
	"dataplane/mainapp/worker"
	"encoding/json"
	"log"
	"time"

	"github.com/google/uuid"
	"gorm.io/datatypes"
)

type Command struct {
	Command string `json:command`
}

func (PipelineNodes) IsEntity() {}

func (PipelineNodes) TableName() string {
	return "pipeline_nodes"
}

type PipelineNodes struct {
	NodeID        string         `gorm:"PRIMARY_KEY;type:varchar(128);" json:"node_id"`
	PipelineID    string         `gorm:"index:idx_pipelineid_nodes;" json:"pipeline_id"`
	Name          string         `gorm:"type:varchar(255);" json:"name"`
	EnvironmentID string         `json:"environment_id"`
	NodeType      string         `json:"node_type"`      //trigger, process, checkpoint
	NodeTypeDesc  string         `json:"node_type_desc"` //python, bash, play, scheduler, checkpoint, api
	TriggerOnline bool           `gorm:"default:false;" json:"trigger_online"`
	Description   string         `json:"description"`
	Commands      datatypes.JSON `json:"commands"`
	Meta          datatypes.JSON `json:"meta"`
	Dependency    datatypes.JSON `json:"dependency"`
	Destination   datatypes.JSON `json:"destination"`
	WorkerGroup   string         `json:"worker_group"` //Inherits Pipeline workergroup unless specified
	Active        bool           `json:"active"`
	FolderName    string         `json:"folder_name"`
	FolderID      string         `json:"folder_id"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     *time.Time     `json:"updated_at"`
	DeletedAt     *time.Time     `json:"deleted_at,omitempty"`
}

func RunPipeline(pipelineID string, environmentID string) (models.PipelineRuns, error) {

	// start := time.Now().UTC()

	// Doesnt require concurrency safety, should be written / read in sequence.
	var destinations = make(map[string][]string)
	var dependencies = make(map[string][]string)
	var triggerData = make(map[string]*models.WorkerTasks)

	// Retrieve pipeline details
	pipelinedata := models.Pipelines{}
	err := database.DBConn.Where("pipeline_id = ? and environment_id =?", pipelineID, environmentID).First(&pipelinedata).Error
	if err != nil {

		if config.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return models.PipelineRuns{}, err
	}

	// Create a run
	run := models.PipelineRuns{
		RunID:         uuid.NewString(),
		PipelineID:    pipelineID,
		Status:        "Running",
		EnvironmentID: environmentID,
		CreatedAt:     time.Now().UTC(),
		RunJSON:       pipelinedata.Json,
	}

	err = database.DBConn.Create(&run).Error
	if err != nil {

		if config.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return models.PipelineRuns{}, err
	}

	// Chart a course
	nodes := make(chan []*PipelineNodes)
	nodesdata := []*PipelineNodes{}

	go func() {
		database.DBConn.Raw(`
		select
		n.node_id,
		n.pipeline_id,
		n.name,
		n.environment_id,
		n.node_type,
		n.node_type_desc,
		n.trigger_online,
		n.commands,
		n.dependency,
		n.destination,
		n.worker_group,
		n.active,
		n.created_at,
		c.folder_name,
		c.folder_id
		from pipeline_nodes n 
		left join code_folders c on 
		c.pipeline_id = n.pipeline_id and 
		c.environment_id = n.environment_id and 
		c.node_id = n.node_id and
		n.level = 'node' and
		n.f_type = 'folder'
		where n.pipeline_id =? and n.environment_id =?
		`, pipelineID, environmentID).Scan(&nodesdata)

		// Where("pipeline_id = ? and environment_id =?", pipelineID, environmentID)
		nodes <- nodesdata
	}()

	edges := make(chan []*models.PipelineEdges)
	edgesdata := []*models.PipelineEdges{}
	go func() {
		database.DBConn.Where("pipeline_id = ? and environment_id =?", pipelineID, environmentID).Find(&edgesdata)
		edges <- edgesdata
	}()

	// Start at trigger
	RunID := run.RunID

	// log.Println("Run ID:", RunID)

	// Return go routines
	nodesdata = <-nodes
	edgesdata = <-edges

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
			Folder:        "",
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
