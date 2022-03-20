package filesystem

import (
	"dataplane/mainapp/config"
	"dataplane/mainapp/database"
	"dataplane/mainapp/database/models"
	"errors"
	"log"
	"os"

	"github.com/google/uuid"
)

/* Will overwrite any existing files */
func CreateFile(input models.CodeFiles, Folder string, Content []byte) (models.CodeFiles, string, error) {

	var filename string

	id := uuid.NewString()
	input.FileID = id
	filename = input.FileName
	returnpath := Folder + filename

	createFile := config.CodeDirectory + Folder + filename

	// Does the file already exists?
	var existingFile models.CodeFiles
	database.DBConn.Where("environment_id = ? and node_id =? and file_name = ?", input.EnvironmentID, input.NodeID, input.FileName).First(&existingFile)

	if _, err := os.Stat(config.CodeDirectory + Folder); os.IsNotExist(err) {

		if config.Debug == "true" {
			log.Println("Directory doesnt exists: ", config.CodeDirectory+Folder)
			return input, returnpath, errors.New("Directory doesnt exists")
		}

	} else {

		err := os.WriteFile(createFile, Content, 0644)
		if err != nil {
			return input, returnpath, errors.New("Failed to write file")
		}

		if config.Debug == "true" {
			log.Println("Created file: ", createFile)
		}

	}

	// Create record if doesnt exist
	if existingFile.FileID == "" {

		errdb := database.DBConn.Create(&input).Error
		if errdb != nil {
			if config.Debug == "true" {
				log.Println("Directory create error:", errdb)
				return input, returnpath, errors.New("File create database error")
			}

		}
	}

	return input, returnpath, nil

}
