package runcode

import (
	"errors"
	"time"

	"github.com/dataplane-app/dataplane/app/mainapp/database"
	"github.com/dataplane-app/dataplane/app/mainapp/database/models"
	"github.com/dataplane-app/dataplane/app/mainapp/logging"
	"github.com/dataplane-app/dataplane/app/mainapp/remoteworker"
)

/*
Task status: Queue, Allocated, Started, Failed, Success
*/
func RunCodeRPAFileCancel(runid string, environmentID string) error {

	/* look up task details */
	var task models.CodeRun
	err2 := database.DBConn.First(&task, "run_id = ? and environment_id = ?", runid, environmentID).Error
	if err2 != nil {
		rerror := "Cancelled run code failed: lookup run task - " + err2.Error()
		/* return error to front end logs */
		WSLogError(environmentID, runid, rerror, models.CodeRun{})
		logging.PrintSecretsRedact(err2.Error())
	}

	if task.Status == "Success" || task.Status == "Fail" {
		rerror := "Cancelled run code failed: run already completed with fail or success"
		/* return error to front end logs */
		WSLogError(environmentID, runid, rerror, models.CodeRun{})
		return errors.New(rerror)
	}

	/* Send cancel request to remote worker
	Online remote worker already chosen: task.WorkerID
	*/
	runSend := models.CodeRun{
		CreatedAt:     time.Now().UTC(),
		EnvironmentID: task.EnvironmentID,
		RunID:         task.RunID,
		WorkerGroup:   task.WorkerGroup,
		WorkerID:      task.WorkerID,
	}

	errrpc := remoteworker.RPCRequest(task.WorkerID, runid, "runcodefilecancel", runSend)
	if errrpc != nil {
		rerror := "Cancelled run code failed: RPC error" + errrpc.Error()
		/* return error to front end logs */
		WSLogError(environmentID, runid, rerror, models.CodeRun{})
		return errors.New(rerror)
	}

	//
	return nil

}
