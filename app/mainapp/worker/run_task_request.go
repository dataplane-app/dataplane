package worker

import (
	"dataplane/mainapp/database"
	"dataplane/mainapp/database/models"
	"dataplane/mainapp/logging"
	"dataplane/mainapp/messageq"
	"dataplane/mainapp/utilities"
	"dataplane/workers/config"
	"dataplane/workers/runtask"
	"encoding/json"
	"errors"
	"log"
	"os"
	"strconv"
	"time"

	"github.com/tidwall/buntdb"
	"gorm.io/gorm/clause"
)

/*
Task status: Queue, Allocated, Started, Failed, Success
*/
func WorkerRunTask(workerGroup string, taskid string, runid string, envID string, pipelineID string, nodeID string, commands []string, Folder string, FolderID string, Version string, RunType string) error {

	// Important not to update status to avoid timing issue where it can overwrite a success a status
	TaskFinal := models.WorkerTasks{
		TaskID:        taskid,
		CreatedAt:     time.Now().UTC(),
		EnvironmentID: envID,
		RunID:         runid,
		WorkerGroup:   workerGroup,
		StartDT:       time.Now().UTC(),
	}

	UpdateWorkerTasksNoStatus(TaskFinal)

	/* Look up chosen workers -
	if none, keep trying for 10 x 2 seconds
	before failing */
	// var err1 error
	markFail := true
	maxRetiresAllowed := 5
	var onlineWorkers []models.WorkerStats
	for i := 0; i < maxRetiresAllowed; i++ {

		// log.Println(i)

		database.GoDBWorker.View(func(tx *buntdb.Tx) error {
			tx.AscendEqual("workergroup", `{"WorkerGroup":"`+workerGroup+`"}`, func(key, val string) bool {

				// `{"WorkerGeroup":"`+workerGroup+`"}`,
				var worker models.WorkerStats
				// log.Println("Workers:", key, val)

				if os.Getenv("debug") == "true" {
					log.Println("worker loaded:", val)
				}

				err := json.Unmarshal([]byte(val), &worker)
				if err != nil {
					logging.PrintSecretsRedact(err)
				}
				onlineWorkers = append(onlineWorkers, worker)
				return true

			})

			return nil
		})

		// log.Println("X:", onlineWorkers)

		// log.Println("err1:", err1)

		if len(onlineWorkers) == 0 {
			log.Println(workerGroup + " not online, retrying in 2 seconds (" + strconv.Itoa(i) + " of " + strconv.Itoa(maxRetiresAllowed) + ")")
		} else {

			// Choose a worker based on load balancing strategy - default is round robin
			var loadbalanceNext string

			// if a worker group goes offline in between, choose the next in the load balancer and retry

			if os.Getenv("debug") == "true" {
				log.Println("Worker LB:", onlineWorkers[0].LB, onlineWorkers)
			}

			switch onlineWorkers[0].LB {
			case "roundrobin":
				loadbalanceNext = utilities.Balance(onlineWorkers, workerGroup)

			default:
				loadbalanceNext = utilities.Balance(onlineWorkers, workerGroup)

			}

			// Send the request to the worker
			if os.Getenv("debug") == "true" {
				log.Println("Selected worker:", onlineWorkers[0].LB, loadbalanceNext)
			}

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

			var response runtask.TaskResponse

			// log.Println("Task channel: ", "task."+workerGroup+"."+loadbalanceNext)

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
				markFail = true
				break
			}
			// } else {
			// 	log.Println(loadbalanceNext + " not online, retrying in 2 seconds (" + strconv.Itoa(i) + " of " + strconv.Itoa(maxRetiresAllowed) + ")")
			// }
			if config.Debug == "true" {
				log.Println("Send to worker", response.R, response.M)
			}
		}
		time.Sleep(2 * time.Second)
	}

	// log.Println("Mark as fail:", markFail)

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
			if config.Debug == "true" {
				logging.PrintSecretsRedact(errnat)
			}

		}

		// If worker recovers but part of the pipeline starts running - cancel any running jobs
		// Get any current running tasks and cancel those tasks
		currentTask := []*models.WorkerTasks{}
		err := database.DBConn.Where("run_id = ? and environment_id = ? and status=?", runid, envID, "Run").Find(&currentTask).Error
		if err != nil {
			logging.PrintSecretsRedact(err.Error())
		}

		if len(currentTask) > 0 {
			for _, t := range currentTask {
				errt := WorkerCancelTask(t.TaskID)
				if errt != nil {
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
			logging.PrintSecretsRedact(err2.Error.Error())
		}

		err3 := database.DBConn.Model(&models.WorkerTasks{}).Where("run_id = ? and status=?", runid, "Queue").Updates(map[string]interface{}{"status": "Fail", "reason": "Upstream no workers"}).Error
		if err3 != nil {
			logging.PrintSecretsRedact(err3.Error())
		}

		return errors.New("Worker failed.")

	}

	//
	return nil

}
