package dfscache

import (
	"log"

	dpconfig "github.com/dataplane-app/dataplane/mainapp/config"
	"github.com/dataplane-app/dataplane/mainapp/database"
	"github.com/dataplane-app/dataplane/mainapp/database/models"
	"github.com/dataplane-app/dataplane/mainapp/messageq"
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

	if dpconfig.Debug == "true" {
		log.Println("folder to delete:", folderpath)
	}

	_, errnats := messageq.MsgReply(channel, folderpath, &response)

	if errnats != nil {
		log.Println("Send to worker error nats:", errnats)
		return errnats
	}

	return nil
}

/*
Delete or change pipeline.
*/
func InvalidateCachePipeline(environmentID string, folderpath string, pipelineID string) error {
	// Write to node level cache

	updateQuery := `
	UPDATE code_node_cache
	SET cache_valid = false, updated_at = now()
	FROM pipeline_nodes
	WHERE code_node_cache.environment_id = ? and pipeline_nodes.pipeline_id =? and 
	pipeline_nodes.node_id = code_node_cache.node_id and pipeline_nodes.environment_id = code_node_cache.environment_id;
	`
	err := database.DBConn.Exec(updateQuery, environmentID, pipelineID).Error

	if err != nil {
		return err
	}

	// Write to file level cache (file gets overwritten)
	deleteQuery := `
	DELETE FROM code_files_cache
	USING pipeline_nodes
	WHERE code_files_cache.environment_id = ? and pipeline_nodes.pipeline_id =? and 
	pipeline_nodes.node_id = code_files_cache.node_id and pipeline_nodes.environment_id = code_files_cache.environment_id;
	`
	err = database.DBConn.Exec(deleteQuery, environmentID, pipelineID).Error

	if err != nil {
		return err
	}

	getWorkerGroups := []*models.PipelineNodes{}
	err = database.DBConn.Distinct("worker_group").Select("worker_group").Where("pipeline_id = ? and environment_id =? and worker_group <> ''", pipelineID, environmentID).Find(&getWorkerGroups).Error
	if err != nil {
		log.Println("Error getting worker groups for cache delete", err)
		return err
	}

	if dpconfig.Debug == "true" {
		log.Println("folder to delete:", folderpath)
	}

	var response models.TaskResponse
	for _, x := range getWorkerGroups {
		channel := "DisributedStorageRemoval." + x.WorkerGroup
		// log.Println(channel)
		_, errnats := messageq.MsgReply(channel, folderpath, &response)

		if errnats != nil {
			log.Println("Send to worker error nats:", errnats)
			return errnats
		}
	}

	return nil
}

/*
Delete or change deployment.
*/
func InvalidateCacheDeployment(environmentID string, folderpath string, pipelineID string, version string) error {
	// Write to node level cache

	updateQuery := `
	UPDATE deploy_code_node_cache
	SET cache_valid = false, updated_at = now()
	FROM deploy_pipeline_nodes
	WHERE 
	deploy_code_node_cache.environment_id = ? and 
	deploy_pipeline_nodes.pipeline_id =? and  
	deploy_code_node_cache.version = ? and

	deploy_pipeline_nodes.node_id = deploy_code_node_cache.node_id and 
	deploy_pipeline_nodes.environment_id = deploy_code_node_cache.environment_id and 
	deploy_pipeline_nodes.version = deploy_code_node_cache.version;
	`
	err := database.DBConn.Exec(updateQuery, environmentID, pipelineID, version).Error

	if err != nil {
		return err
	}

	// Write to file level cache (file gets overwritten)
	deleteQuery := `
	DELETE FROM deploy_code_files_cache
	USING deploy_pipeline_nodes
	WHERE 
	deploy_code_files_cache.environment_id = ? and 
	deploy_pipeline_nodes.pipeline_id =? and 
	deploy_code_files_cache.version = ? and

	deploy_pipeline_nodes.node_id = deploy_code_files_cache.node_id and 
	deploy_pipeline_nodes.environment_id = deploy_code_files_cache.environment_id and
	deploy_pipeline_nodes.version = deploy_code_files_cache.version;
	`
	err = database.DBConn.Exec(deleteQuery, environmentID, pipelineID, version).Error

	if err != nil {
		return err
	}

	getWorkerGroups := []*models.DeployPipelineNodes{}
	err = database.DBConn.Distinct("worker_group").Select("worker_group").Where("pipeline_id = ? and environment_id =? and worker_group <> ''", pipelineID, environmentID).Find(&getWorkerGroups).Error
	if err != nil {
		log.Println("Error getting worker groups for cache delete", err)
		return err
	}

	if dpconfig.Debug == "true" {
		log.Println("folder to delete:", folderpath)
	}

	var response models.TaskResponse
	for _, x := range getWorkerGroups {
		channel := "DisributedStorageRemoval." + x.WorkerGroup
		// log.Println(channel)
		_, errnats := messageq.MsgReply(channel, folderpath, &response)

		if errnats != nil {
			log.Println("Send to worker error nats:", errnats)
			return errnats
		}
	}

	return nil
}
