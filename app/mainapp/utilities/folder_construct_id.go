package utilities

import (
	"dataplane/mainapp/database"
	"dataplane/mainapp/database/models"
	"errors"
)

func FolderConstructByID(id string) (string, error) {

	var filepath string

	var currentFolder models.CodeFolders

	database.DBConn.Where("folder_id=?", id).First(&currentFolder)

	if currentFolder.FolderID != id {
		return "", errors.New("File record not found.")
	}

	filepath = currentFolder.FolderID + "_" + currentFolder.FolderName

	// log.Println(filepath, currentFolder.ParentID)

	// var parentFolder models.CodeFolders
	if currentFolder.Level != "platform" {

		for i := 1; i < 100; i++ {

			currentFolder.FolderID = currentFolder.ParentID
			database.DBConn.First(&currentFolder)

			filepath = currentFolder.FolderID + "_" + currentFolder.FolderName + "/" + filepath
			if currentFolder.Level == "platform" {
				break
			}
		}
	}

	return filepath + "/", nil

}
