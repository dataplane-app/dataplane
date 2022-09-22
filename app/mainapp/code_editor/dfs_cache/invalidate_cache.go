package dfscache

import (
	"dataplane/mainapp/database"
	"dataplane/mainapp/database/models"
	"dataplane/mainapp/messageq"
	"log"
)

/*
New or edited file - add to database, invalidate node and file level cache and this will automatically added by reference to cache on run time.
*/
func InvalidateCacheSingle(nodeID string, environmentID string, fileID string) error {
	// Write to node level cache
	err := database.DBConn.Model(&models.CodeNodeCache{}).Where("node_id = ? and environment_id = ?", nodeID, environmentID).Update("cache_valid", false).Error

	if err != nil {
		return err
	}

	// Write to file level cache (file gets overwritten)
	err = database.DBConn.Where("node_id = ? and environment_id = ? and file_id = ?", nodeID, environmentID, fileID).Delete(&models.CodeFilesCache{}).Error

	if err != nil {
		return err
	}

	return nil
}

/*
Delete a file, move file or folder name change - invalidate the node cache, remove all file level cache and remove the entire folder in each worker.
*/
func InvalidateCacheNode(nodeID string, environmentID string, folderpath string) error {
	// Write to node level cache
	err := database.DBConn.Model(&models.CodeNodeCache{}).Where("node_id = ? and environment_id = ?", nodeID, environmentID).Update("cache_valid", false).Error

	if err != nil {
		return err
	}

	// Write to file level cache (file gets overwritten)
	err = database.DBConn.Where("node_id = ? and environment_id = ?", nodeID, environmentID).Delete(&models.CodeFilesCache{}).Error

	if err != nil {
		return err
	}

	var response models.TaskResponse

	getWorkerGroup := models.PipelineNodes{}
	err = database.DBConn.Select("worker_group").Where("node_id = ? and environment_id =?", nodeID, environmentID).First(&getWorkerGroup).Error
	if err != nil {
		log.Println("Error getting worker groups for cache delete", err)
		return err
	}
	channel := "DisributedStorageRemoval." + getWorkerGroup.WorkerGroup

	log.Println("folder to delete:", folderpath)

	_, errnats := messageq.MsgReply(channel, folderpath, &response)

	if errnats != nil {
		log.Println("Send to worker error nats:", errnats)
		return errnats
	}

	return nil
}
