package worker

import (
	"errors"
	"log"
	"strconv"
	"time"

	dpconfig "github.com/dataplane-app/dataplane/app/mainapp/config"
	"github.com/dataplane-app/dataplane/app/mainapp/database"
	"github.com/dataplane-app/dataplane/app/mainapp/database/models"
	"github.com/dataplane-app/dataplane/app/mainapp/logging"
	"github.com/dataplane-app/dataplane/app/mainapp/remoteworker"
)

func RPAWorker(envID string, workerGroup string, runid string, taskid string, pipelineID string, nodeID string, commands []string, Folder string, FolderID string, Version string, RunType string) error {

	// runSend := models.CodeRun{}
	markFail := true
	maxRetiresAllowed := 20
	// var errmsg string
	var remoteWorkerID string
	var errrw error

	/* Choose an online remote worker */
	for i := 0; i < maxRetiresAllowed; i++ {

		remoteWorkerID, errrw = remoteworker.OnlineRemoteWorkers(envID, workerGroup)
		if errrw != nil {
			log.Println("Code run choose remote worker: " + errrw.Error())
			// return errors.New("Code run choose remote worker: " + errrw.Error())
		}

		// successful send to worker
		if remoteWorkerID != "" {
			markFail = false
			break
		}

		log.Println("RPA in group " + workerGroup + " not online, retrying in 2 seconds (" + strconv.Itoa(i) + " of " + strconv.Itoa(maxRetiresAllowed) + ")")

		time.Sleep(2 * time.Second)
	}
	log.Println("RPA worker:", remoteWorkerID)

	/* ---- Attach the file name to the command that would be run ----- */
	// commandsprep := []string{}
	// commandsprep = append(commandsprep, "${{nodedirectory}}"+filesdata.FileName)

	// commandJSON, err := json.Marshal(commands)
	// if err != nil {
	// 	logging.PrintSecretsRedact(err)
	// 	return errors.New("Failed to convert code run commands to json.")
	// }

	log.Println("Selected RPA worker:", remoteWorkerID)

	// Get pipeline info
	pipeline := models.Pipelines{}
	err := database.DBConn.Where("pipeline_id = ? and environment_id = ?", pipelineID, envID).Select("name").Find(&pipeline).Error
	if err != nil {
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return errors.New("Retrieve pipeline database error")
	}

	// Get Node info
	node := models.PipelineNodes{}
	err = database.DBConn.Where("node_id = ? and environment_id = ?", nodeID, envID).Select("name").Find(&node).Error
	if err != nil {
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return errors.New("Retrieve pipeline node database error")
	}
	// log.Printf("📢 node name: %v\n", node.Name)
	// log.Printf("📢 pipeline.Name: %v\n", pipeline.Name)

	tasksend := models.WorkerTaskSend{
		TaskID:        taskid,
		CreatedAt:     time.Now().UTC(),
		EnvironmentID: envID,
		RunID:         runid,
		PipelineID:    pipelineID,
		NodeID:        nodeID,
		WorkerGroup:   workerGroup,
		WorkerID:      remoteWorkerID,
		Commands:      commands,
		Folder:        Folder,
		FolderID:      FolderID,
		Version:       Version,
		RunType:       RunType,
	}

	// err2 := database.DBConn.Create(&runSend)
	// if err2.Error != nil {
	// 	logging.PrintSecretsRedact(err2.Error.Error())
	// 	return errors.New("Failed to create code run in database.")
	// }

	errrpc := remoteworker.RPCRequest(remoteWorkerID, runid, "pipeline.runtask", tasksend)
	if errrpc != nil {
		return errors.New("RPA run code RPC failed: " + errrpc.Error())
	}

	/* Wait for a response from RPA worker, then remove key from Redis if no response after 10 seconds then fail the entire pipeline */
	log.Println("RPA marked failed", markFail)
	return nil

}

/*
	runSend = models.CodeRun{
		RunID:         runid,
		NodeID:        nodeID,
		NodeName:      node.Name,
		PipelineID:    pipelineID,
		PipelineName:  pipeline.Name,
		FileID:        filesdata.FileID,
		CreatedAt:     time.Now().UTC(),
		EnvironmentID: envID,
		WorkerGroup:   workerGroup,
		WorkerID:      remoteWorkerID,
		Commands:      commandJSON,
		Status:        "Queue",
		Folder:        folderMap,
		FolderID:      folderIDMap,
	}
*/
