package filesystem

import (
	"errors"
	"log"
	"os"

	dpconfig "github.com/dataplane-app/dataplane/app/mainapp/config"
	"github.com/dataplane-app/dataplane/app/mainapp/database"
	"github.com/dataplane-app/dataplane/app/mainapp/database/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func CreateFolder(input models.CodeFolders, parentFolder string) (models.CodeFolders, string, error) {

	var createDirectory string
	var foldername string

	createDirectory = ""
	foldername = ""

	id := uuid.New().String()

	err := database.DBConn.Transaction(func(tx *gorm.DB) error {

		input.FolderID = id

		/* Node folders do not have IDs attached because they need to be referenced in code */
		if input.FType == "node-folder" {
			foldername = FolderFriendly(input.FolderName)
		} else {
			foldername = input.FolderID + "_" + FolderFriendly(input.FolderName)
		}

		input.FolderName = FolderFriendly(input.FolderName)

		// createDirectory = parentFolder + foldername

		errdb := tx.Create(&input).Error
		if errdb != nil {
			if dpconfig.Debug == "true" {
				log.Println("Directory create error:", errdb)
			}
		}
		return nil

	})

	if err != nil {
		return input, "", errors.New("Folder create error: " + err.Error())
	}

	returnpath := parentFolder + foldername

	createDirectory = dpconfig.CodeDirectory + parentFolder + foldername

	if dpconfig.FSCodeFileStorage == "LocalFile" {
		if _, err := os.Stat(createDirectory); os.IsNotExist(err) {
			// path/to/whatever does not exist
			err := os.MkdirAll(createDirectory, os.ModePerm)
			if err != nil {
				if dpconfig.Debug == "true" {
					log.Println("Create directory error:", err)
					return input, returnpath, err
				}
			}
			if dpconfig.Debug == "true" {
				log.Println("Created directory: ", createDirectory)
			}

		} else {
			if dpconfig.Debug == "true" {
				log.Println("Directory already exists: ", createDirectory)
			}
		}
	}

	return input, returnpath, nil

}
