package worker

import (
	"encoding/json"
	"errors"
	"log"
	"strconv"
	"strings"
	"time"

	dpconfig "github.com/dataplane-app/dataplane/app/mainapp/config"
	"github.com/dataplane-app/dataplane/app/mainapp/database"
	"github.com/dataplane-app/dataplane/app/mainapp/database/models"
	"github.com/dataplane-app/dataplane/app/mainapp/logging"
	"github.com/dataplane-app/dataplane/app/mainapp/messageq"
	"github.com/dataplane-app/dataplane/app/mainapp/remoteworker"
	wsockets "github.com/dataplane-app/dataplane/app/mainapp/websockets"
	"github.com/google/uuid"
	"gorm.io/gorm/clause"
)

func RPAWorker(envID string, workerGroup string, runid string, taskid string, pipelineID string, nodeID string, commands []string, Folder string, FolderID string, Version string, RunType string) error {

	// runSend := models.CodeRun{}
	markFail := true
	maxRetiresAllowed := 5
	// var errmsg string
	var remoteWorkerID string
	var errrw error
	var errmsg string

	/* Check if the worker is locked */
	// lock node for run
	var createLock = models.WorkerTaskLock{
		RunID:  runid,
		NodeID: nodeID,
	}
	errl := database.DBConn.Create(&createLock).Error
	if errl != nil {
		if strings.Contains(errl.Error(), "duplicate") {
			if dpconfig.Debug == "true" {
				log.Println("Lock for run and node exists:", runid, nodeID)
			}
		} else {
			log.Println(errl.Error())
		}

		return errl
	}

	// --- Check if this task is already running
	var lockCheck models.WorkerTasks
	err2 := database.DBConn.Select("task_id", "status").Where("task_id = ? and environment_id = ?", taskid, envID).First(&lockCheck).Error
	if err2 != nil {
		log.Println(err2.Error())
		return err2
	}

	if lockCheck.Status != "Queue" {
		log.Println("Skipping not in queue", runid, nodeID)
		return errors.New("")
	}

	// log.Println("taskupdate." + envID + "." + runid)

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

		/* Let the front end know that its trying to get a worker */
		uidstring := uuid.NewString()
		sendmsg := models.LogsSend{
			CreatedAt:     time.Now().UTC(),
			UID:           uidstring,
			Log:           "RPA in group " + workerGroup + " not online, retrying in 2 seconds (" + strconv.Itoa(i) + " of " + strconv.Itoa(maxRetiresAllowed) + ")",
			LogType:       "error",
			EnvironmentID: envID,
			RunID:         runid,
		}

		jsonSend, errjson := json.Marshal(sendmsg)
		if errjson != nil {
			log.Println("Json marshal error: ", errjson)
		}

		room := "workerlogs." + envID + "." + runid + "." + nodeID
		wsockets.Broadcast <- wsockets.Message{Room: room, Data: jsonSend}

		time.Sleep(2 * time.Second)

	}
	// log.Println("RPA worker:", remoteWorkerID)

	/* ---- Attach the file name to the command that would be run ----- */
	// commandsprep := []string{}
	// commandsprep = append(commandsprep, "${{nodedirectory}}"+filesdata.FileName)

	// commandJSON, err := json.Marshal(commands)
	// if err != nil {
	// 	logging.PrintSecretsRedact(err)
	// 	return errors.New("Failed to convert code run commands to json.")
	// }

	// ----- Successfully found RPA worker -------
	if markFail == false {
		// log.Println("Selected RPA worker:", remoteWorkerID)

		// Important not to update status to avoid timing issue where it can overwrite a success a status
		TaskFinal := models.WorkerTasks{
			TaskID:        taskid,
			CreatedAt:     time.Now().UTC(),
			EnvironmentID: envID,
			RunID:         runid,
			WorkerGroup:   workerGroup,
			WorkerID:      remoteWorkerID,
			StartDT:       time.Now().UTC(),
			WorkerType:    "rpa-python",
			Status:        "Run",
			NodeID:        nodeID,
			PipelineID:    pipelineID,
		}

		UpdateWorkerTasks(TaskFinal)

		/* Update the front end status to running */

		errnat := messageq.MsgSend("taskupdate."+envID+"."+runid, TaskFinal)
		if errnat != nil {
			errmsg = "Failed to send to nats: " + "taskupdate." + envID + "." + runid
			if dpconfig.Debug == "true" {
				logging.PrintSecretsRedact(errnat)
			}

		}

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
	}

	// ----- Failed with RPA worker -------
	// If task not successfully sent, mark as failed
	if markFail == true {
		log.Println("RPA marked failed", markFail)
		TaskFinal := models.WorkerTasks{
			TaskID:        taskid,
			CreatedAt:     time.Now().UTC(),
			EnvironmentID: envID,
			RunID:         runid,
			WorkerGroup:   workerGroup,
			WorkerID:      remoteWorkerID,
			StartDT:       time.Now().UTC(),
			Status:        "Fail",
			Reason:        "No workers",
		}

		UpdateWorkerTasks(TaskFinal)

		errnat := messageq.MsgSend("taskupdate."+envID+"."+runid, TaskFinal)
		if errnat != nil {
			errmsg = "Failed to send to nats: " + "taskupdate." + envID + "." + runid
			if dpconfig.Debug == "true" {
				logging.PrintSecretsRedact(errnat)
			}

		}

		// If worker recovers but part of the pipeline starts running - cancel any running jobs
		// Get any current running tasks and cancel those tasks
		currentTask := []*models.WorkerTasks{}
		err := database.DBConn.Where("run_id = ? and environment_id = ? and status=?", runid, envID, "Run").Find(&currentTask).Error
		if err != nil {
			errmsg = "DB error couldn't find existing running tasks: " + err.Error()
			logging.PrintSecretsRedact(err.Error())
		}

		if len(currentTask) > 0 {
			for _, t := range currentTask {
				errt := WorkerCancelTask(t.TaskID, envID, "rpa")
				if errt != nil {
					errmsg = "Could not cancel remaining tasks on fail: " + errt.Error()
					logging.PrintSecretsRedact(errt.Error())
				}
			}
		}

		// Update all the future tasks
		// Update pipeline as failed
		run := models.PipelineRuns{
			RunID:   runid,
			Status:  "Fail",
			EndedAt: time.Now().UTC(),
		}

		err2 := database.DBConn.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "run_id"}},
			DoUpdates: clause.AssignmentColumns([]string{"ended_at", "status"}),
		}).Create(&run)
		if err2.Error != nil {
			errmsg = "Pipeline database update on run fail error : " + err2.Error.Error()
			logging.PrintSecretsRedact(err2.Error.Error())
		}

		err3 := database.DBConn.Model(&models.WorkerTasks{}).Where("run_id = ? and status=?", runid, "Queue").Updates(map[string]interface{}{"status": "Fail", "reason": "Upstream no workers"}).Error
		if err3 != nil {
			errmsg = "database update on run fail error 2 : " + err3.Error()
			logging.PrintSecretsRedact(err3.Error())
		}

		return errors.New("Server worker failed: " + errmsg)
	}

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
