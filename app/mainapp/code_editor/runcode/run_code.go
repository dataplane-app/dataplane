package runcode

import (
	"dataplane/mainapp/code_editor/filesystem"
	"dataplane/mainapp/config"
	"dataplane/mainapp/database"
	"dataplane/mainapp/database/models"
	"dataplane/mainapp/logging"
	"dataplane/mainapp/messageq"
	"encoding/json"
	"log"
	"os"
	"time"

	"github.com/google/uuid"
)

type Command struct {
	Command string `json:command`
}

func RunCode(pipelineID string, nodeID string, fileID string, environmentID string, workergroup string, commands []string) (models.CodeRun, error) {

	// start := time.Now().UTC()

	// Retrieve pipeline details
	// pipelinedata := models.Pipelines{}
	// err := database.DBConn.Where("pipeline_id = ? and environment_id =?", pipelineID, environmentID).First(&pipelinedata).Error
	// if err != nil {

	// 	if config.Debug == "true" {
	// 		logging.PrintSecretsRedact(err)
	// 	}
	// 	return models.PipelineRuns{}, err
	// }

	// Create a code run
	commandsprep := []Command{}
	for _, v := range commands {
		commandsprep = append(commandsprep, Command{Command: v})
	}

	commandJSON, err := json.Marshal(commandsprep)
	if err != nil {
		logging.PrintSecretsRedact(err)
	}

	// ------ Obtain folders
	folder := make(chan models.CodeFiles)
	parentfolder := make(chan string)
	foldersdata := models.CodeFiles{}

	go func() {
		database.DBConn.Where("file_id = ? and environment_id =? and level = ?", fileID, environmentID, "node_file").Find(&foldersdata)
		folder <- foldersdata

		pf := ""

		if foldersdata.FolderID != "" {
			pf, _ = filesystem.FolderConstructByID(database.DBConn, foldersdata.FolderID, environmentID)
		}
		parentfolder <- pf
	}()

	// Chart a course
	nodes := make(chan models.PipelineNodes)
	nodesdata := models.PipelineNodes{}

	go func() {

		database.DBConn.Where("pipeline_id = ? and node_id = ? and environment_id =?", pipelineID, nodeID, environmentID).Find(&nodesdata)
		nodes <- nodesdata
	}()

	// Return go routines
	nodesdata = <-nodes
	foldersdata = <-folder
	parentfolderdata := <-parentfolder

	// log.Println("parent folder", parentfolderdata)

	// Map folder structure:
	var folderMap string
	var folderIDMap string

	dir := parentfolderdata + foldersdata.FolderID + "_" + foldersdata.FileID

	folderMap = dir
	folderIDMap = foldersdata.FolderID
	if config.Debug == "yes" {
		if _, err := os.Stat(config.CodeDirectory + dir); os.IsExist(err) {
			log.Println("Dir exists:", config.CodeDirectory+dir)

		}
	}

	run := models.CodeRun{
		RunID:         uuid.NewString(),
		NodeID:        nodeID,
		FileID:        fileID,
		Status:        "Queue",
		EnvironmentID: environmentID,
		WorkerGroup:   workergroup,
		Commands:      commandJSON,
		FolderID:      folderMap,
		Folder:        folderIDMap,
		CreatedAt:     time.Now().UTC(),
	}

	err = database.DBConn.Create(&run).Error
	if err != nil {

		if config.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return models.CodeRun{}, err
	}

	// Start at trigger
	RunID := run.RunID

	// ---------- Run the first set of dependencies ----------

	// send message that trigger node has run - for websockets
	errnat := messageq.MsgSend("coderun."+environmentID+"."+RunID, run)
	if errnat != nil {
		if config.Debug == "true" {
			logging.PrintSecretsRedact(errnat)
		}

	}
	// err = worker.WorkerRunTask("python_1", triggerData[s].TaskID, RunID, environmentID, pipelineID, s, []string{"sleep " + strconv.Itoa(x) + "; echo " + s})
	// err = worker.WorkerRunTask(triggerData[s].WorkerGroup, triggerData[s].TaskID, RunID, environmentID, pipelineID, s, commandsend, folderMap[triggerData[s].NodeID], folderNodeMap[triggerData[s].NodeID])
	// if err != nil {
	// 	if config.Debug == "true" {
	// 		logging.PrintSecretsRedact(err)
	// 	}
	// 	return run, err
	// } else {
	// 	if config.Debug == "true" {
	// 		logging.PrintSecretsRedact(triggerData[s].TaskID)
	// 	}
	// }

	// log.Println(" -> ", destinations)
	// log.Println(" -> ", dependencies)

	// jsonString, err := json.Marshal(destinations)
	// fmt.Println(string(jsonString), err)

	// stop := time.Now()
	// Do something with response
	// log.Println("🐆 Run time:", fmt.Sprintf("%f", float32(stop.Sub(start))/float32(time.Millisecond))+"ms")

	return run, nil

}
