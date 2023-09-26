package distfilesystem

import (
	"errors"
	"log"
	"os"
	"strings"

	"github.com/dataplane-app/dataplane/app/mainapp/code_editor/filesystem"
	"github.com/dataplane-app/dataplane/app/mainapp/database/models"
	"github.com/dataplane-app/dataplane/app/mainapp/utilities"

	"github.com/dataplane-app/dataplane/app/mainapp/database"
	wrkerconfig "github.com/dataplane-app/dataplane/app/workers/config"
)

/*
 1. Find all the files for this node.
 2. Batch download files

NOTE: Node ID is the node in the graph and not the worker ID.
*/
func DistributedStorageCodeRunDownload(environmentID string, folder string, folderID string, nodeID string) error {

	// log.Println("folder", folder)
	if strings.Contains(folder, "/coderun/") == false {
		log.Println("Folder incorrect format - doesn't contain /pipelines/")
		return errors.New("Folder incorrect format - doesn't contain /pipelines/")
	}

	FilesOutput := []*models.CodeFilesCacheOutput{}
	// writeCache := []*models.CodeFilesCache{}

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
		cf.file_id = cs.file_id and cf.environment_id = cs.environment_id 
		and cf.node_id = ? and cf.environment_id =? and cs.run_include = true
		`

	err := database.DBConn.Raw(query, nodeID, environmentID).Scan(&FilesOutput).Error
	if err != nil {
		log.Println("Download cached files code run: ", err)
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
			// newdir :=

			// , err := filesystem.FolderConstructByID(database.DBConn, file.FolderID, environmentID, "pipelines")
			newdir, err := filesystem.NodeLevelFolderConstructByID(database.DBConn, file.FolderID, environmentID)

			log.Println("Worker new dir:", newdir)

			if err != nil {
				log.Println(err)
				return err
			}
			directoryRun = wrkerconfig.FSCodeDirectory + folder + newdir
			filecreate = directoryRun + folder + file.FileName

			log.Println("Directory to run:", directoryRun)

		} else {

			// Base folder already known
			directoryRun = wrkerconfig.FSCodeDirectory + folder
			filecreate = wrkerconfig.FSCodeDirectory + folder + file.FileName

		}

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
		errfile := os.WriteFile(filecreate, file.FileStore, 0644)
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

	return nil
}
