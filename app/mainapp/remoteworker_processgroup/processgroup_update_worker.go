package remoteworker_processgroup

import (
	"log"

	"github.com/dataplane-app/dataplane/app/mainapp/database"
	"github.com/dataplane-app/dataplane/app/mainapp/database/models"
	"github.com/dataplane-app/dataplane/app/mainapp/remoteworker"
	"github.com/google/uuid"
)

/* Function to send an update request to all workers for a given process group */
func ProcessGroupUpdateWorkers(processgroup string) {

	/* Look up the proces group */
	var pgData models.RemoteProcessGroups

	errpg := database.DBConn.Select("remote_process_group_id", "packages", "language").Where("remote_process_group_id = ? and active = true", processgroup).Find(&pgData).Error
	if errpg != nil {
		log.Println("Remote worker retrieve process groups db error: ", errpg)
		// return []models.RemoteWorkerEnvironments{}, err
	}

	/* Look up all the environments and workers to send updates */
	var processGroups []models.RemoteWorkerEnvironments

	err := database.DBConn.Select("environment_id", "remote_process_group_id", "worker_id").Where("remote_process_group_id = ?", processgroup).Find(&processGroups).Error
	if err != nil {
		log.Println("Remote worker retrieve process groups db error: ", err)
		// return []models.RemoteWorkerEnvironments{}, err
	}

	/* For each record send request to worker to update pip packages */
	var PGDataSend models.RemotePGOutput
	for _, v := range processGroups {
		id := uuid.NewString()
		PGDataSend = models.RemotePGOutput{
			WorkerID:             v.WorkerID,
			RemoteProcessGroupID: v.RemoteProcessGroupID,
			EnvironmentID:        v.EnvironmentID,
			Name:                 pgData.Name,
			Packages:             pgData.Packages,
			Language:             pgData.Language,
		}
		errrpc := remoteworker.RPCRequest(v.WorkerID, id, "updateprocessgroup", PGDataSend)
		if errrpc != nil {
			// return runSend, errors.New("RPA run code RPC failed: " + errrpc.Error())
		}

	}

}
