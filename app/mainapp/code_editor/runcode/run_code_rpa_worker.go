package runcode

import (
	"encoding/json"
	"errors"
	"time"

	dpconfig "github.com/dataplane-app/dataplane/app/mainapp/config"
	"github.com/dataplane-app/dataplane/app/mainapp/database"
	"github.com/dataplane-app/dataplane/app/mainapp/database/models"
	"github.com/dataplane-app/dataplane/app/mainapp/logging"
	"github.com/dataplane-app/dataplane/app/mainapp/remoteworker"
)

func RunCodeRPAWorker(pipelineId string, envID string, nodeID string, workerGroup string, runid string, commands []string, filesdata models.CodeFiles, folderMap string, folderIDMap string) (models.CodeRun, error) {

	runSend := models.CodeRun{}

	/* Choose an online remote worker */
	var remoteWorkerID string
	remoteWorkerID, errrw := remoteworker.OnlineRemoteWorkers(envID, workerGroup)
	if errrw != nil {
		return models.CodeRun{}, errors.New("Code run choose remote worker: " + errrw.Error())
	}

	/* ---- Attach the file name to the command that would be run ----- */
	commandsprep := []string{}
	commandsprep = append(commandsprep, "${{nodedirectory}}"+filesdata.FileName)

	commandJSON, err := json.Marshal(commandsprep)
	if err != nil {
		logging.PrintSecretsRedact(err)
		return runSend, errors.New("Failed to convert code run commands to json.")
	}

	// Get pipeline info
	pipeline := models.Pipelines{}
	err = database.DBConn.Where("pipeline_id = ? and environment_id = ?", pipelineId, envID).Select("name").Find(&pipeline).Error
	if err != nil {
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return models.CodeRun{}, errors.New("Retrieve pipeline database error")
	}

	// Get Node info
	node := models.PipelineNodes{}
	err = database.DBConn.Where("node_id = ? and environment_id = ?", nodeID, envID).Select("name").Find(&node).Error
	if err != nil {
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return models.CodeRun{}, errors.New("Retrieve pipeline node database error")
	}
	// log.Printf("📢 node name: %v\n", node.Name)
	// log.Printf("📢 pipeline.Name: %v\n", pipeline.Name)

	runSend = models.CodeRun{
		RunID:         runid,
		NodeID:        nodeID,
		NodeName:      node.Name,
		PipelineID:    pipelineId,
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

	err2 := database.DBConn.Create(&runSend)
	if err2.Error != nil {
		logging.PrintSecretsRedact(err2.Error.Error())
		return runSend, errors.New("Failed to create code run in database.")
	}

	errrpc := remoteworker.RPCRequest(remoteWorkerID, runid, "runcode", runSend)
	if errrpc != nil {
		return runSend, errors.New("RPA run code RPC failed: " + errrpc.Error())
	}

	return runSend, nil

}
