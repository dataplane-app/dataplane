package distfilesystem

import (
	"errors"
	"log"
	"os"
	"path/filepath"

	"github.com/dataplane-app/dataplane/app/mainapp/code_editor/filesystem"
	"github.com/dataplane-app/dataplane/app/mainapp/database"
	"github.com/dataplane-app/dataplane/app/mainapp/database/models"
	"github.com/dataplane-app/dataplane/app/mainapp/utilities"
	wrkerconfig "github.com/dataplane-app/dataplane/app/workers/config"
	"gorm.io/gorm/clause"
)

func DistributedStorageFileSave(FilesOutput []*models.CodeFilesCacheOutput, directoryRun string, nodeID string, environmentID string, runType string, version string) error {

	var err error

	writePipelineCache := []*models.CodeFilesCache{}
	writeDeployCache := []*models.DeployCodeFilesCache{}
	writeCodeRunCache := []*models.CodeRunFilesCache{}

	for i, file := range FilesOutput {

		filecreate := ""
		directoryCreate := ""

		// log.Println("Folder:", i, file.FileName, file.FolderID, directoryRun, file.Level)
		/* Construct folder routes for any missing files that are not node base folder */
		if file.Level != "node" {

			// Look up folder structure
			newdir, err := filesystem.NodeLevelFolderConstructByID(database.DBConn, file.FolderID, environmentID)

			if err != nil {
				log.Println(err)
				return err
			}
			directoryCreate = filepath.Join(directoryRun, newdir)

		} else {
			directoryCreate = directoryRun
		}

		filecreate = filepath.Join(directoryCreate, file.FileName)

		/* Create folder if folder doesn't exist */
		if _, err := os.Stat(directoryCreate); os.IsNotExist(err) {

			errdir := os.MkdirAll(directoryCreate, 0700)
			if errdir != nil {
				log.Println("Make directory error run:", errdir)
				return errdir
			}
			if wrkerconfig.Debug == "true" {
				log.Println("Node dir not found - create:", directoryCreate)
			}

		}

		/* Write file contents */
		errfile := os.WriteFile(filecreate, file.FileStore, 0644)
		if errfile != nil {
			log.Println("Create file error:", errfile)
			return errfile
		}

		md5, md5err := utilities.Hash_file_md5(filecreate)
		if md5err != nil {
			log.Println("MD5 error:", md5err)
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

		/* Cache to correct model */
		switch runType {
		case "deployment":

			writeDeployCache = append(writeDeployCache, &models.DeployCodeFilesCache{
				FileID:           file.FileID,
				NodeID:           nodeID,
				WorkerGroup:      wrkerconfig.WorkerGroup,
				WorkerID:         wrkerconfig.WorkerID,
				EnvironmentID:    environmentID,
				Version:          version,
				ChecksumMD5Check: true,
			})

		case "pipeline":
			writePipelineCache = append(writePipelineCache, &models.CodeFilesCache{
				FileID:           file.FileID,
				NodeID:           nodeID,
				WorkerGroup:      wrkerconfig.WorkerGroup,
				WorkerID:         wrkerconfig.WorkerID,
				EnvironmentID:    environmentID,
				ChecksumMD5Check: true,
			})

		case "coderun":

			writeCodeRunCache = append(writeCodeRunCache, &models.CodeRunFilesCache{
				FileID:           file.FileID,
				NodeID:           nodeID,
				WorkerGroup:      wrkerconfig.WorkerGroup,
				WorkerID:         wrkerconfig.WorkerID,
				EnvironmentID:    environmentID,
				ChecksumMD5Check: true,
			})
		}

	}

	// Write to low level cache - separated if deployment or not

	switch runType {
	case "deployment":

		if len(writeDeployCache) > 0 {
			err = database.DBConn.Clauses(clause.OnConflict{
				UpdateAll: true,
			}).Create(&writeDeployCache).Error
			if err != nil {
				log.Println("Write cached files: ", err)
			}
		}

	case "pipeline":

		if len(writePipelineCache) > 0 {
			err = database.DBConn.Clauses(clause.OnConflict{
				UpdateAll: true,
			}).Create(&writePipelineCache).Error
			if err != nil {
				log.Println("Write cached files: ", err)
			}
		}

	case "coderun":

		if len(writeCodeRunCache) > 0 {
			err = database.DBConn.Clauses(clause.OnConflict{
				UpdateAll: true,
			}).Create(&writeCodeRunCache).Error
			if err != nil {
				log.Println("Write cached files: ", err)
			}
		}
	}

	return nil

}
