package worker

import (
	"log"
	"time"

	"github.com/dataplane-app/dataplane/app/mainapp/database/models"
)

/*
Task status: Queue, Allocated, Started, Failed, Success
*/
func WorkerRunTask(workerGroup string, taskid string, runid string, envID string, pipelineID string, nodeID string, commands []string, Folder string, FolderID string, Version string, RunType string, workerType string) error {

	// Important not to update status to avoid timing issue where it can overwrite a success a status
	TaskFinal := models.WorkerTasks{
		TaskID:        taskid,
		CreatedAt:     time.Now().UTC(),
		EnvironmentID: envID,
		RunID:         runid,
		WorkerGroup:   workerGroup,
		StartDT:       time.Now().UTC(),
		WorkerType:    workerType,
	}

	UpdateWorkerTasksNoStatus(TaskFinal)

	/* Which type of worker */
	switch workerType {

	/* --- Server worker types ---- */
	case "python", "bash", "checkpoint":
		err := ServerWorker(envID, workerGroup, runid, taskid, pipelineID, nodeID, commands, Folder, FolderID, Version, RunType)
		if err != nil {
			WSTaskLogError(envID, runid, err.Error(), nodeID)
			return err
		}
	case "rpa-python":
		log.Println("RPA python")
	default:
		WSTaskLogError(envID, runid, "Worker type not found.", nodeID)
		log.Println("Type not found")
	}
	return nil

}
