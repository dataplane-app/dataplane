package remoteworker_processgroup

import (
	"log"

	"github.com/dataplane-app/dataplane/app/mainapp/database"
	"github.com/dataplane-app/dataplane/app/mainapp/database/models"
)

func AllProcessGroups(remoteWorkerID string) ([]models.RemotePGOutput, error) {
	var processGroups []models.RemotePGOutput

	err := database.DBConn.
		Model(&models.RemoteWorkerEnvironments{}).
		Joins("inner join remote_process_groups on remote_process_groups.remote_process_group_id = remote_worker_environments.remote_process_group_id").
		Select("remote_worker_environments.environment_id", "remote_worker_environments.remote_process_group_id", "remote_worker_environments.worker_id", "remote_process_groups.name", "remote_process_groups.packages", "remote_process_groups.language").
		Where("remote_worker_environments.worker_id = ? and remote_process_groups.active=true", remoteWorkerID).
		Find(&processGroups).Error
	if err != nil {
		log.Println("Remote worker retrieve process groups db error: ", err)
		return []models.RemotePGOutput{}, err
	}
	return processGroups, nil
}
