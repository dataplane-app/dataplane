package worker

import (
	"log"
	"time"

	"github.com/dataplane-app/dataplane/app/mainapp/database/models"
)

/*
Task status: Queue, Allocated, Started, Failed, Success
*/
func WorkerRunTask(workerGroup string, taskid string, runid string, envID string, pipelineID string, nodeID string, commands []string, Version string, RunType string, workerType string, InputData bool) error {

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
		err := ServerWorker(envID, workerGroup, runid, taskid, pipelineID, nodeID, commands, Version, RunType, InputData)
		if err != nil {
			WSTaskLogError(envID, runid, err.Error(), nodeID, taskid)
			return err
		}

	/* Send the task to the RPA worker */
	case "rpa-python":
		err := RPAWorker(envID, workerGroup, runid, taskid, pipelineID, nodeID, commands, Version, RunType, InputData)
		if err != nil {
			WSTaskLogError(envID, runid, err.Error(), nodeID, taskid)
			return err
		}
	default:
		WSTaskLogError(envID, runid, "Worker type not found.", nodeID, taskid)
		log.Println("Type not found")
	}
	return nil

}
