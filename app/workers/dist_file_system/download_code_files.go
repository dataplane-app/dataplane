package distfilesystem

import (
	"dataplane/workers/config"
	"dataplane/workers/database"
	"log"
)

/*
On startup this will download the files from distributed file system.

0. All saved file syncs should happen before this download to ensure no changes - a sync log should be kept to check, wait for sync to finish?
1. Get all the pipelines that are associated with this worker - this will be derived from nodes because a node can be associated with a single worker.
2. Batch pipelines for download - batches of 10 default
3.

This method may not be used because it would be better to download the files on pipeline run, the first run might be a bit slow but will speed up with known cache
*/
func DownloadFiles() {

	Pipelines := []string{}

	err := database.DBConn.Debug().Table("pipeline_nodes").Select("pipeline_id").Distinct("pipeline_id").Where("worker_group =?", config.WorkerGroup).Find(&Pipelines).Error
	if err != nil {
		log.Println(err)
	}

	for _, x := range Pipelines {
		log.Println(x)
	}

	log.Println("Done.")
}
