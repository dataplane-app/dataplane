package filesystem

import (
	"dataplane/mainapp/database/models"
	"errors"

	"gorm.io/gorm"
)

func FolderConstructByID(db *gorm.DB, id string, environmentID string) (string, error) {

	var filepath string

	var currentFolder models.CodeFolders

	db.Where("folder_id=? and environment_id = ?", id, environmentID).First(&currentFolder)

	if currentFolder.FolderID != id {
		return "", errors.New("File record not found.")
	}

	filepath = currentFolder.FolderID + "_" + currentFolder.FolderName

	// log.Println(filepath, currentFolder.ParentID)

	// var parentFolder models.CodeFolders
	if currentFolder.Level != "platform" {

		for i := 1; i < 100; i++ {

			currentFolder.FolderID = currentFolder.ParentID
			db.First(&currentFolder)

			filepath = currentFolder.FolderID + "_" + currentFolder.FolderName + "/" + filepath
			if currentFolder.Level == "platform" {
				break
			}
		}
	}

	return filepath + "/", nil

}
