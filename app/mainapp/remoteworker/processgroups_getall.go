package remoteworker

import (
	"log"

	"github.com/dataplane-app/dataplane/app/mainapp/database"
	"github.com/dataplane-app/dataplane/app/mainapp/database/models"
)

func AllProcessGroups(remoteWorkerID string) ([]models.RemoteWorkerEnvironments, error) {
	var processGroups []models.RemoteWorkerEnvironments

	err := database.DBConn.Select("environment_id", "remote_process_group_id", "worker_id").Where("worker_id = ?", remoteWorkerID).Find(&processGroups).Error
	if err != nil {
		log.Println("Remote worker retrieve process groups db error: ", err)
		return []models.RemoteWorkerEnvironments{}, err
	}
	return processGroups, nil
}
