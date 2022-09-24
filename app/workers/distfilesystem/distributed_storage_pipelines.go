package distfilesystem

import (
	"dataplane/mainapp/code_editor/filesystem"
	"dataplane/mainapp/database/models"
	"dataplane/mainapp/utilities"
	wrkerconfig "dataplane/workers/config"
	"dataplane/workers/database"
	"errors"
	"io/ioutil"
	"log"
	"os"
	"strings"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

/*
1. Check the cache that files are up to date.
	1a. Cache at node level
	1b. Cache at file level
2. Find all the files for this node.
3. Batch download files

NOTE: Node ID is the node in the graph and not the worker ID.
*/
func DistributedStoragePipelineDownload(environmentID string, folder string, folderID string, nodeID string) error {

	// log.Println("folder", folder)
	if strings.Contains(folder, "/pipelines/") == false {
		log.Println("Folder incorrect format - doesn't contain /pipelines/")
		return errors.New("Folder incorrect format - doesn't contain /pipelines/")
	}

	if strings.Contains(folder, "_Platform") == false {
		log.Println("Folder incorrect format - doesn't contain _Platform")
		return errors.New("Folder incorrect format - doesn't contain _Platform")
	}
	/* node cache is a higher level cache for the node */
	nodeCache := models.CodeNodeCache{}
	err := database.DBConn.Select("cache_valid").Where("node_id = ? and environment_id = ? and worker_id = ?", nodeID, environmentID, wrkerconfig.WorkerID).First(&nodeCache).Error
	if err != nil && err != gorm.ErrRecordNotFound {
		return err
	}

	/*
		If the cache is invalid, download only the changed files, otherwise do nothing
	*/
	if nodeCache.CacheValid != true {

		if wrkerconfig.Debug == "true" {
			log.Println("Node cache invalid, updating node:", nodeID)
		}

		FilesOutput := []*models.CodeFilesCacheOutput{}
		writeCache := []*models.CodeFilesCache{}

		/* Retrieve all the files which are not in lower level cache in table code_node_cache */
		query := `
		select 
		cf.file_id, 
		cf.folder_id, 
		cf.file_name, 
		cs.checksum_md5,
		cs.file_store
		from code_files cf, code_files_store cs
		where 
		cf.file_id = cs.file_id and cf.environment_id = cs.environment_id and cf.node_id = ? and cs.run_include = true
		and NOT EXISTS
        (
        SELECT  file_id
        FROM code_files_cache cfc
        WHERE   
		cf.file_id = cfc.file_id and 
		cfc.worker_id = ? and 
		cf.node_id = cfc.node_id and 
		cf.environment_id = cfc.environment_id
        )
		`

		err = database.DBConn.Raw(query, nodeID, wrkerconfig.WorkerID).Scan(&FilesOutput).Error
		if err != nil {
			log.Println("Download cached files: ", err)
			return err
		}

		// distfilesystem.BatchFileWrite(FilesOutput, folderID, environmentID, folder)
		// log.Println("==== FS:", RunType, version)

		for i, file := range FilesOutput {

			filecreate := ""
			directoryRun := ""
			// log.Println(file.FileName, file.FolderID, folderID, folder)
			/* Construct folder routes for any missing files that are not node base folder */
			if file.FolderID != folderID {

				// Look up folder structure
				newdir, err := filesystem.FolderConstructByID(database.DBConn, file.FolderID, environmentID, "pipelines")

				// log.Println("Worker new dir:", newdir)

				if err != nil {
					log.Println(err)
					return err
				}
				directoryRun = wrkerconfig.FSCodeDirectory + newdir
				filecreate = directoryRun + file.FileName

				/* Create folder if folder doesn't exist */
				if _, err := os.Stat(directoryRun); os.IsNotExist(err) {

					errdir := os.MkdirAll(directoryRun, 0700)
					if errdir != nil {
						log.Println(errdir)
						return errdir
					}
					if wrkerconfig.Debug == "true" {
						log.Println("Node dir not found - create:", directoryRun)
					}

				}

				/* Write file contents */
				errfile := ioutil.WriteFile(filecreate, file.FileStore, 0644)
				if errfile != nil {
					log.Println(errfile)
					return errfile
				}

				md5, md5err := utilities.Hash_file_md5(filecreate)
				if md5err != nil {
					log.Println(md5err)
					return md5err
				}

				if md5 != file.ChecksumMD5 {
					errtxt := "MD5 checksum mismatch: " + filecreate
					log.Println(errtxt)
					return errors.New(errtxt)
				}

				if wrkerconfig.Debug == "true" {
					log.Println(i, "Cache file:", filecreate)
				}

			} else {

				// Base folder already known
				directoryRun = wrkerconfig.FSCodeDirectory + folder
				filecreate = wrkerconfig.FSCodeDirectory + folder + file.FileName

				/* Create folder if folder doesn't exist */
				if _, err := os.Stat(directoryRun); os.IsNotExist(err) {

					errdir := os.MkdirAll(directoryRun, 0700)
					if errdir != nil {
						log.Println(errdir)
						return errdir
					}
					if wrkerconfig.Debug == "true" {
						log.Println("Node dir not found - create:", directoryRun)
					}

				}

				/* Write file contents */
				errfile := ioutil.WriteFile(filecreate, file.FileStore, 0644)
				if errfile != nil {
					log.Println(errfile)
					return errfile
				}

				md5, md5err := utilities.Hash_file_md5(filecreate)
				if md5err != nil {
					log.Println(md5err)
					return md5err
				}

				if md5 != file.ChecksumMD5 {
					errtxt := "MD5 checksum mismatch: " + filecreate
					log.Println(errtxt)
					return errors.New(errtxt)
				}

				if wrkerconfig.Debug == "true" {
					log.Println(i, "Cache file:", filecreate)
				}
			}

			/* */
			writeCache = append(writeCache, &models.CodeFilesCache{
				FileID:           file.FileID,
				NodeID:           nodeID,
				WorkerGroup:      wrkerconfig.WorkerGroup,
				WorkerID:         wrkerconfig.WorkerID,
				EnvironmentID:    environmentID,
				ChecksumMD5Check: true,
			})

		}

		// Write to low level cache
		if len(writeCache) > 0 {
			err = database.DBConn.Clauses(clause.OnConflict{
				UpdateAll: true,
			}).Create(&writeCache).Error
			if err != nil {
				log.Println("Write cached files: ", err)
			}
		}

		writeNodeCache := models.CodeNodeCache{
			WorkerGroup:   wrkerconfig.WorkerGroup,
			NodeID:        nodeID,
			WorkerID:      wrkerconfig.WorkerID,
			EnvironmentID: environmentID,
			CacheValid:    true,
		}

		// Write to node level cache
		err = database.DBConn.Clauses(clause.OnConflict{
			UpdateAll: true,
		}).Create(&writeNodeCache).Error
		if err != nil {
			log.Println("Write cached files: ", err)
		}

	}

	return nil
}
