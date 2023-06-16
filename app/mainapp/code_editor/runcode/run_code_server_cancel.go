package runcode

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

	"gorm.io/gorm/clause"
)

/*
Task status: Queue, Allocated, Started, Failed, Success
*/
func RunCodeServerCancel(runid string, environmentID string) error {

	/* look up task details */
	var task models.CodeRun
	err2 := database.DBConn.First(&task, "run_id = ? and environment_id = ?", runid, environmentID)
	if err2.Error != nil {
		logging.PrintSecretsRedact(err2.Error.Error())
	}

	if task.Status == "Success" || task.Status == "Fail" {
		return errors.New("Task completed with fail or success")
	}

	// log.Println(task, taskid)
	// return nil

	/* Look up chosen workers -
	if none, keep trying for 10 x 2 seconds
	before failing */
	// var err1 error
	maxRetiresAllowed := 5

	// if a worker group goes offline in between, choose the next in the load balancer and retry

	complete := false
	for i := 0; i < maxRetiresAllowed; i++ {

		tasksend := models.CodeRun{
			CreatedAt:     time.Now().UTC(),
			EnvironmentID: task.EnvironmentID,
			RunID:         task.RunID,
			WorkerGroup:   task.WorkerGroup,
			WorkerID:      task.WorkerID,
		}

		var response models.TaskResponse
		_, errnats := messageq.MsgReply("runcodefilecancel."+task.WorkerGroup+"."+task.WorkerID, tasksend, &response)

		if errnats != nil {
			log.Println("Send to worker error nats:", errnats)
		}

		// successful send to worker
		if response.R == "ok" {
			complete = true
			break
		} else {
			log.Println(task.WorkerID + " not online, retrying in 2 seconds (" + strconv.Itoa(i) + " of " + strconv.Itoa(maxRetiresAllowed) + ")")
		}
		if dpconfig.Debug == "true" {
			log.Println("Send to worker", response.R)
		}
		time.Sleep(2 * time.Second)
	}

	if complete == false {
		// mark task as failed
		taskUpdate := models.CodeRun{
			RunID:   task.RunID,
			EndedAt: time.Now().UTC(),
			Status:  "Fail",
			Reason:  "Cancelled worker offline",
		}

		err2 := database.DBConn.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "run_id"}},
			DoUpdates: clause.AssignmentColumns([]string{"ended_at", "status", "reason"}),
		}).Create(&taskUpdate)
		if err2.Error != nil {
			logging.PrintSecretsRedact(err2.Error.Error())
		}
	}

	//
	return nil

}
