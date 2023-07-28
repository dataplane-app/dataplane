package runcode

import (
	"encoding/json"
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
)

func RunCodeServerWorker(envID string, nodeID string, workerGroup string, runid string, commands []string, filesdata models.CodeFiles, folderMap string, folderIDMap string, replayRunID string) (models.CodeRun, error) {

	/* Look up chosen workers -
	if none, keep trying for 10 x 2 seconds
	before failing */
	// var err1 error
	runSend := models.CodeRun{}
	markFail := true
	maxRetiresAllowed := 5
	var onlineWorkers []models.WorkerStats
	for i := 0; i < maxRetiresAllowed; i++ {

		// log.Println(i)

		var workers []models.Workers
		var worker models.WorkerStats

		err := database.DBConn.Where("environment_id =? and worker_group = ?", envID, workerGroup).Find(&workers).Error
		if err != nil && err != gorm.ErrRecordNotFound {
			return models.CodeRun{}, errors.New("Code run: Worker groups database error.")
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

			// ---- Select which worker to send the request -----
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

			commandsprep := []Command{}
			for _, v := range commands {
				commandsprep = append(commandsprep, Command{Command: v})
			}

			commandJSON, err := json.Marshal(commandsprep)
			if err != nil {
				logging.PrintSecretsRedact(err)
			}

			runSend = models.CodeRun{
				RunID:         runid,
				NodeID:        nodeID,
				FileID:        filesdata.FileID,
				ReplayRunID:   replayRunID,
				CreatedAt:     time.Now().UTC(),
				EnvironmentID: envID,
				WorkerGroup:   workerGroup,
				WorkerID:      loadbalanceNext,
				Commands:      commandJSON,
				Status:        "Queue",
				Folder:        folderMap,
				FolderID:      folderIDMap,
			}

			err2 := database.DBConn.Create(&runSend)
			if err2.Error != nil {
				logging.PrintSecretsRedact(err2.Error.Error())
			}

			var response models.TaskResponse

			// ----- Are the files downloaded from distributed storage -----
			/*
				Instruct selected worker to download files
				If there is a retry, this should be part of that retry
				NOTE: This was moved to where the code is executed, it is hard to time the timeout for request / reply
				It needs to run before the code is run. In addition, there is no need for two requests.
			*/

			// log.Println("Task channel: ", "task."+workerGroup+"."+loadbalanceNext)
			channel := "runcodefile." + workerGroup + "." + loadbalanceNext
			// log.Println(channel)
			_, errnats := messageq.MsgReply(channel, runSend, &response)

			if errnats != nil {
				log.Println("Send to worker error nats:", errnats)
			}

			// successful send to worker
			if response.R == "ok" {
				markFail = false
				break
			}

			if response.R != "ok" {
				if dpconfig.Debug == "true" {
					log.Println("Failed worker send but got response: ", response)
				}
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

	// log.Println("Mark as fail:", markFail)

	// If task not successfully sent, mark as failed
	updatedt := time.Now().UTC()
	if markFail {
		TaskFinal := models.CodeRun{
			EnvironmentID: envID,
			RunID:         runid,
			WorkerGroup:   workerGroup,
			UpdatedAt:     &updatedt,
			EndedAt:       time.Now().UTC(),
			Status:        "Fail",
			Reason:        "No workers",
		}

		UpdateCodeRun(TaskFinal)
		response := models.TaskResponse{R: "ok"}
		_, errnats := messageq.MsgReply("coderunupdate", TaskFinal, &response)
		if errnats != nil {
			logging.PrintSecretsRedact(errnats)
			return models.CodeRun{}, errors.New("No workers available")
		}

		runSend.Status = TaskFinal.Status
		runSend.Reason = TaskFinal.Reason

		return runSend, errors.New("Run code marked as failed.")

		// err3 := database.DBConn.Model(&models.WorkerTasks{}).Where("run_id = ? and status=?", runid, "Queue").Updates(map[string]interface{}{"status": "Fail", "reason": "Upstream no workers"}).Error
		// if err3 != nil {
		// 	logging.PrintSecretsRedact(err3.Error())
		// }

	}

	return runSend, nil

}
