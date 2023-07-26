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
	"github.com/dataplane-app/dataplane/app/mainapp/utilities"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func ServerWorker(envID string, workerGroup string, runid string, taskid string, pipelineID string, nodeID string, commands []string, Folder string, FolderID string, Version string, RunType string) error {

	/* Look up chosen workers -
	if none, keep trying for 10 x 2 seconds
	before failing */
	// var err1 error
	markFail := true
	maxRetiresAllowed := 5
	var errmsg string
	var onlineWorkers []models.WorkerStats
	for i := 0; i < maxRetiresAllowed; i++ {

		// log.Println(i)

		var workers []models.Workers
		var worker models.WorkerStats

		/* Look up online workers */
		err := database.DBConn.Where("environment_id =? and worker_group = ?", envID, workerGroup).Find(&workers).Error
		if err != nil && err != gorm.ErrRecordNotFound {
			return errors.New("Code run: Worker groups database error.")
		}

		for _, v := range workers {

			worker = models.WorkerStats{
				WorkerGroup: v.WorkerGroup,
				WorkerID:    v.WorkerID,
				Status:      v.Status,
				CPUPerc:     v.CPUPerc,
				Load:        v.Load,
				MemoryPerc:  v.MemoryPerc,
				MemoryUsed:  v.MemoryUsed,
				EnvID:       v.EnvironmentID,
				LB:          v.LB,
				WorkerType:  v.WorkerType,
			}

			onlineWorkers = append(onlineWorkers, worker)

		}

		// log.Println("X:", onlineWorkers)

		// log.Println("err1:", err1)

		if len(onlineWorkers) == 0 {
			log.Println(workerGroup + " not online, retrying in 2 seconds (" + strconv.Itoa(i) + " of " + strconv.Itoa(maxRetiresAllowed) + ")")
		} else {

			// Choose a worker based on load balancing strategy - default is round robin
			var loadbalanceNext string

			// if a worker group goes offline in between, choose the next in the load balancer and retry

			if dpconfig.Debug == "true" {
				log.Println("Worker LB:", onlineWorkers[0].LB, onlineWorkers)
			}

			switch onlineWorkers[0].LB {
			case "roundrobin":
				loadbalanceNext = utilities.Balance(onlineWorkers, workerGroup)

			default:
				loadbalanceNext = utilities.Balance(onlineWorkers, workerGroup)

			}

			// Send the request to the worker
			if dpconfig.Debug == "true" {
				log.Println("Selected worker:", onlineWorkers[0].LB, loadbalanceNext)
			}

			// log.Println("Pipeline ID:", runid)

			tasksend := models.WorkerTaskSend{
				TaskID:        taskid,
				CreatedAt:     time.Now().UTC(),
				EnvironmentID: envID,
				RunID:         runid,
				PipelineID:    pipelineID,
				NodeID:        nodeID,
				WorkerGroup:   workerGroup,
				WorkerID:      loadbalanceNext,
				Commands:      commands,
				Folder:        Folder,
				FolderID:      FolderID,
				Version:       Version,
				RunType:       RunType,
			}

			var response models.TaskResponse

			// log.Println("Task channel: ", "task."+workerGroup+"."+loadbalanceNext)

			// log.Println("Run task", nodeID)

			_, errnats := messageq.MsgReply("task."+workerGroup+"."+loadbalanceNext, tasksend, &response)

			if errnats != nil {
				log.Println("Send to worker error nats:", errnats)
			}

			// successful send to worker
			if response.R == "ok" {
				markFail = false
				break
			}

			if response.R != "ok" {
				errmsg = "Worker did not respond ok."
				markFail = true
				break
			}
			// } else {
			// 	log.Println(loadbalanceNext + " not online, retrying in 2 seconds (" + strconv.Itoa(i) + " of " + strconv.Itoa(maxRetiresAllowed) + ")")
			// }
			if dpconfig.Debug == "true" {
				log.Println("Send to worker", response.R, response.M)
			}
		}
		time.Sleep(2 * time.Second)
	}

	// If task not successfully sent, mark as failed
	if markFail {
		TaskFinal := models.WorkerTasks{
			TaskID:        taskid,
			CreatedAt:     time.Now().UTC(),
			EnvironmentID: envID,
			RunID:         runid,
			WorkerGroup:   workerGroup,
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
				errt := WorkerCancelTask(t.TaskID, envID, "server")
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
