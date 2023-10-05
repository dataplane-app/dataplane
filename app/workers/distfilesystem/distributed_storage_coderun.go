package distfilesystem

import (
	"errors"
	"log"
	"strings"

	"github.com/dataplane-app/dataplane/app/mainapp/database/models"
	wrkerconfig "github.com/dataplane-app/dataplane/app/workers/config"

	"github.com/dataplane-app/dataplane/app/mainapp/database"
)

/*
 1. Find all the files for this node.
 2. Batch download files

NOTE: Node ID is the node in the graph and not the worker ID.
*/
func DistributedStorageCodeRunDownload(environmentID string, directoryRun string, nodeID string) error {

	// log.Println("folder", folder)
	if strings.Contains(directoryRun, "/pipeline/") == false {
		log.Println("Folder incorrect format - doesn't contain /pipeline/")
		return errors.New("Folder incorrect format - doesn't contain /pipeline/")
	}

	FilesOutput := []*models.CodeFilesCacheOutput{}
	// writeCache := []*models.CodeFilesCache{}

	/* Retrieve all the files which are not in lower level cache in table code_node_cache */
	/* Retrieve all the files which are not in lower level cache in table code_node_cache */
	query := `
		select 
		cf.file_id, 
		cf.folder_id, 
		cf.file_name, 
		cs.checksum_md5,
		cs.file_store,
		cfolder.level
		from code_files cf, code_files_store cs, code_folders cfolder
		where 
		cf.folder_id = cfolder.folder_id and
		cf.file_id = cs.file_id and 
		cf.environment_id = cs.environment_id and 
		cf.node_id = ? and 
		cs.run_include = true and 
		cf.environment_id =?
		and NOT EXISTS
        (
        SELECT  file_id
        FROM code_files_cache cfc
        WHERE   
		cf.file_id = cfc.file_id and 
		cfc.worker_id = ? and 
		cf.node_id = cfc.node_id and 
		cf.environment_id = cfc.environment_id and 
		cf.environment_id =?
        )
		`

	err := database.DBConn.Raw(query, nodeID, environmentID, wrkerconfig.WorkerID, environmentID).Scan(&FilesOutput).Error
	if err != nil {
		log.Println("Download cached files from DB: ", err)
		return err
	}

	errSave := DistributedStorageFileSave(FilesOutput, directoryRun, nodeID, environmentID, "coderun", "latest")
	if errSave != nil {
		log.Println("Error saved to cache: ", errSave)
		return errSave
	}

	return nil
}
