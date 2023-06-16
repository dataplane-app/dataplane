package runcode

import (
	"errors"

	"github.com/dataplane-app/dataplane/app/mainapp/database/models"
)

/*
Task status: Queue, Allocated, Started, Failed, Success
*/
func RunCodeFileCancel(runid string, environmentID string, nodeTypeDesc string) error {

	switch nodeTypeDesc {
	case "python":
		err := RunCodeServerCancel(runid, environmentID)
		if err != nil {
			/* Send back any local errors not happening on the remote worker */
			WSLogError(environmentID, runid, err.Error(), models.CodeRun{})
			return err
		}
	case "rpa-python":
		err := RunCodeRPAFileCancel(runid, environmentID)
		if err != nil {
			/* Send back any local errors not happening on the remote worker */
			WSLogError(environmentID, runid, err.Error(), models.CodeRun{})
			return err
		}
	default:
		return errors.New("Code run type not found.")
	}
	//
	return nil

}
