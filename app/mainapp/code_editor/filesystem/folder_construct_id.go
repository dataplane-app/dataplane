package filesystem

import (
	"dataplane/mainapp/database/models"
	"errors"
	"log"

	"gorm.io/gorm"
)

func FolderConstructByID(db *gorm.DB, id string, environmentID string, subfolder string) (string, error) {

	var filepath string

	var currentFolder models.CodeFolders

	// Needs to check that environment id is matched for security but equally when it reaches platform level is not excluded.
	err := db.Where("folder_id=? and environment_id in (?, ?)", id, environmentID, "d_platform").First(&currentFolder).Error
	if err != nil {
		log.Println("Folder construct:", err)
		return "", errors.New("File record not found.")
	}

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

			if subfolder != "" {

				// Add in sub folder such as pipelines:
				if currentFolder.Level == "environment" {
					filepath = currentFolder.FolderID + "_" + currentFolder.FolderName + "/" + subfolder + "/" + filepath
				} else {
					filepath = currentFolder.FolderID + "_" + currentFolder.FolderName + "/" + filepath
				}
			} else {
				filepath = currentFolder.FolderID + "_" + currentFolder.FolderName + "/" + filepath
			}

			// log.Println(currentFolder.Level, currentFolder.FolderID+"_"+currentFolder.FolderName+"/"+filepath)

			if currentFolder.Level == "platform" {
				break
			}
		}
	}

	return filepath + "/", nil

}
