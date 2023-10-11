package runtask

import (
	"log"
	"time"

	"github.com/dataplane-app/dataplane/app/mainapp/database"
	"github.com/dataplane-app/dataplane/app/mainapp/database/models"
	modelmain "github.com/dataplane-app/dataplane/app/mainapp/database/models"
	"github.com/dataplane-app/dataplane/app/workers/mqworker"
	"github.com/google/uuid"
)

/* Return errors to the logging console */
func WSLogError(logline string, msg models.WorkerTaskSend, TaskUpdate modelmain.WorkerTasks) {

	uidstring := uuid.NewString()
	sendmsg := models.LogsSend{
		CreatedAt:     time.Now().UTC(),
		UID:           uidstring,
		Log:           logline,
		LogType:       "error",
		EnvironmentID: msg.EnvironmentID,
		RunID:         msg.RunID,
	}

	mqworker.MsgSend("workerlogs."+msg.EnvironmentID+"."+msg.RunID+"."+msg.NodeID, sendmsg)

	logmsg := modelmain.LogsWorkers{
		CreatedAt:     time.Now().UTC(),
		UID:           uidstring,
		EnvironmentID: msg.EnvironmentID,
		RunID:         msg.RunID,
		NodeID:        msg.NodeID,
		TaskID:        msg.TaskID,
		Category:      "task",
		Log:           logline,
		LogType:       "error",
	}
	errdb := database.DBConn.Create(&logmsg).Error
	if errdb != nil {
		log.Println("Failed to write error log: ", errdb.Error())
	}

	// "start_dt", "end_dt", "status", "reason", "worker_id", "worker_group"
	TaskUpdate.EndDT = time.Now().UTC()
	TaskUpdate.Status = "Fail"
	TaskUpdate.Reason = "Pre pipeline run fails."
	// TaskUpdate := modelmain.WorkerTasks{
	// 	TaskID:        msg.TaskID,
	// 	CreatedAt:     time.Now().UTC(),
	// 	EnvironmentID: msg.EnvironmentID,
	// 	RunID:         msg.RunID,
	// 	NodeID:        msg.NodeID,
	// 	PipelineID:    msg.PipelineID,
	// 	WorkerGroup:   wrkerconfig.WorkerGroup,
	// 	WorkerID:      wrkerconfig.WorkerID,
	// 	StartDT:       time.Now().UTC(),
	// 	Status:        statusUpdate,
	// }

	UpdateWorkerTasks(TaskUpdate)

}
