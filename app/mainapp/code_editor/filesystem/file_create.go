package filesystem

import (
	"crypto/md5"
	"errors"
	"fmt"
	"log"
	"os"
	"time"

	dfscache "github.com/dataplane-app/dataplane/app/mainapp/code_editor/dfs_cache"
	dpconfig "github.com/dataplane-app/dataplane/app/mainapp/config"
	"github.com/dataplane-app/dataplane/app/mainapp/database"
	"github.com/dataplane-app/dataplane/app/mainapp/database/models"

	"github.com/google/uuid"
	"gorm.io/gorm/clause"
)

/* Will overwrite any existing files */
func CreateFile(input models.CodeFiles, Folder string, Content []byte) (models.CodeFiles, string, error) {

	var filename string

	filename = input.FileName
	returnpath := Folder + filename

	createFile := dpconfig.CodeDirectory + Folder + filename

	// Does the file already exists?
	var existingFile models.CodeFiles
	database.DBConn.Where("environment_id = ? and node_id =? and file_name = ? and folder_id =?", input.EnvironmentID, input.NodeID, input.FileName, input.FolderID).First(&existingFile)

	// -------- if LocalFile --------
	if dpconfig.FSCodeFileStorage == "LocalFile" {
		if _, err := os.Stat(dpconfig.CodeDirectory + Folder); os.IsNotExist(err) {

			if dpconfig.Debug == "true" {
				log.Println("Directory doesnt exists: ", dpconfig.CodeDirectory+Folder)
				return input, returnpath, errors.New("Directory doesnt exists")
			}

		} else {

			err := os.WriteFile(createFile, Content, 0644)
			if err != nil {
				return input, returnpath, errors.New("Failed to write file")
			}

			if dpconfig.Debug == "true" {
				log.Println("Created file: ", createFile)
			}

		}
	}

	// Create record if doesnt exist
	if existingFile.FileID == "" {
		id := uuid.NewString()
		input.FileID = id
		errdb := database.DBConn.Create(&input).Error
		if errdb != nil {
			if dpconfig.Debug == "true" {
				log.Println("Directory create error:", errdb)
				return input, returnpath, errors.New("File create database error")
			}

		}
	} else {
		database.DBConn.Model(&models.CodeFiles{}).Where("file_id = ?", existingFile.FileID).Update("updated_at", time.Now().UTC())
		input.FileID = existingFile.FileID
	}

	md5byte := md5.Sum(Content)
	md5string := fmt.Sprintf("%x", md5byte)

	codefile := models.CodeFilesStore{
		FileID:        input.FileID,
		FileStore:     Content,
		RunInclude:    true,
		External:      false,
		ChecksumMD5:   md5string,
		EnvironmentID: input.EnvironmentID,
	}

	errdb := database.DBConn.Clauses(clause.OnConflict{
		UpdateAll: true,
	}).Create(&codefile).Error
	if errdb != nil {
		log.Println("Create file in database:", errdb)
		return input, returnpath, errors.New("Create file in database error")
	}

	errcache := dfscache.InvalidateCacheSingle(input.NodeID, input.EnvironmentID, input.FileID)
	if errcache != nil {
		log.Println("Create file cache invalidate:", errdb)
	}

	return input, returnpath, nil

}
