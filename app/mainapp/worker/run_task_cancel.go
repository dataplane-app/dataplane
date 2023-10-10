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
	"github.com/dataplane-app/dataplane/app/mainapp/messageq"
	"github.com/dataplane-app/dataplane/app/mainapp/remoteworker"

	"gorm.io/gorm/clause"
)

/*
Task status: Queue, Allocated, Started, Failed, Success
*/
func WorkerCancelTask(taskid string, envID string, workerType string) error {

	/* look up task details */
	var task models.WorkerTasks
	err2 := database.DBConn.First(&task, "task_id = ? and environment_id = ?", taskid, envID)
	if err2.Error != nil {
		logging.PrintSecretsRedact(err2.Error.Error())
	}

	if task.Status == "Success" || task.Status == "Fail" {
		return errors.New("Task completed with fail or success")
	}

	// log.Println("Cancel worker")

	// log.Println(task, taskid)
	complete := false
	switch workerType {
	case "server":
		maxRetiresAllowed := 5

		// if a worker group goes offline in between, choose the next in the load balancer and retry

		for i := 0; i < maxRetiresAllowed; i++ {

			tasksend := models.WorkerTaskSend{
				TaskID:        task.TaskID,
				CreatedAt:     time.Now().UTC(),
				EnvironmentID: task.EnvironmentID,
				RunID:         task.RunID,
				WorkerGroup:   task.WorkerGroup,
				WorkerID:      task.WorkerID,
			}

			var response models.TaskResponse
			_, errnats := messageq.MsgReply("taskcancel."+task.EnvironmentID+"."+task.WorkerGroup+"."+task.WorkerID, tasksend, &response)

			if errnats != nil {
				log.Println("Send to worker for cancel error nats:", errnats)
			}

			// successful send to worker
			if response.R == "ok" {
				complete = true
				break
			} else {
				log.Println(task.WorkerID + " not online for cancel, retrying in 2 seconds (" + strconv.Itoa(i) + " of " + strconv.Itoa(maxRetiresAllowed) + ")")
			}
			if dpconfig.Debug == "true" {
				log.Println("Send to worker", response.R)
			}
			time.Sleep(2 * time.Second)
		}
	case "rpa":

		log.Println("RPA cancel: ", task.RunID, task.WorkerID)

		tasksend := models.WorkerTaskSend{
			TaskID:        task.TaskID,
			CreatedAt:     time.Now().UTC(),
			EnvironmentID: task.EnvironmentID,
			RunID:         task.RunID,
			WorkerGroup:   task.WorkerGroup,
			WorkerID:      task.WorkerID,
			NodeID:        task.NodeID,
		}

		errrpc := remoteworker.RPCNotify(task.WorkerID, "pipeline.canceltask", tasksend)
		if errrpc != nil {
			return errors.New("RPA run code RPC failed: " + errrpc.Error())
		}
		complete = true

		/* Update the front end status to Failed */
		TaskFinal := models.WorkerTasks{
			TaskID:        task.TaskID,
			EnvironmentID: task.EnvironmentID,
			RunID:         task.RunID,
			EndDT:         time.Now().UTC(),
			Status:        "Fail",
			Reason:        "Cancelled RPA worker.",
		}

		UpdateWorkerTasks(TaskFinal)

		/* Update the front end status to running */

		errnat := messageq.MsgSend("taskupdate."+task.EnvironmentID+"."+task.RunID, TaskFinal)
		if errnat != nil {
			if dpconfig.Debug == "true" {
				logging.PrintSecretsRedact("Failed to send to nats: "+"taskupdate."+task.EnvironmentID+"."+task.RunID, errnat)
			}

		}
	default:
		return errors.New("Cancel task worker type missing.")
	}

	if complete == false {
		// mark task as failed
		taskUpdate := models.WorkerTasks{
			TaskID: task.TaskID,
			EndDT:  time.Now().UTC(),
			Status: "Fail",
			Reason: "Cancelled worker offline",
		}

		err2 := database.DBConn.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "task_id"}},
			DoUpdates: clause.AssignmentColumns([]string{"end_dt", "status", "reason"}),
		}).Create(&taskUpdate)
		if err2.Error != nil {
			logging.PrintSecretsRedact(err2.Error.Error())
		}
	}

	//
	return nil

}
