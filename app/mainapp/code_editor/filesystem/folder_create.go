package filesystem

import (
	"dataplane/mainapp/config"
	"dataplane/mainapp/database"
	"dataplane/mainapp/database/models"
	"log"
	"os"

	gonanoid "github.com/matoous/go-nanoid/v2"
)

func CreateFolder(input models.CodeFolders, parentFolder string) (models.CodeFolders, string, error) {

	var createDirectory string
	var foldername string

	// loops to avoid collision in nanoid
	for i := 1; i < 5; i++ {

		createDirectory = ""
		foldername = ""

		id, err := gonanoid.Generate("1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ", 7)
		if err != nil {
			if dpconfig.Debug == "true" {
				log.Println("Directory id error:", err)
			}
			continue
		}

		input.FolderID = id
		foldername = input.FolderID + "_" + FolderFriendly(input.FolderName)

		input.FolderName = FolderFriendly(input.FolderName)

		// createDirectory = parentFolder + foldername

		errdb := database.DBConn.Create(&input).Error
		if errdb != nil {
			if dpconfig.Debug == "true" {
				log.Println("Directory create error:", errdb)
			}
			if i == 4 {
				return input, "", errdb
			}
			continue
		} else {
			break
		}

	}

	returnpath := parentFolder + foldername

	createDirectory = dpconfig.CodeDirectory + parentFolder + foldername

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

	return input, returnpath, nil

}
