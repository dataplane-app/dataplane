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
	err := db.Select("folder_id", "folder_name", "parent_id", "level", "f_type").Where("folder_id=? and environment_id in (?, ?)", id, environmentID, "d_platform").First(&currentFolder).Error
	if err != nil {
		log.Println("Folder construct:", err)
		return "", errors.New("Folder record not found.")
	}

	if currentFolder.FolderID != id {
		return "", errors.New("Folder record not found.")
	}

	nodeFolder := false
	if currentFolder.FType == "node-folder" {
		nodeFolder = true
	}

	if nodeFolder == true {
		filepath = currentFolder.FolderName
	} else {
		filepath = currentFolder.FolderID + "_" + currentFolder.FolderName
	}

	// log.Println(filepath, currentFolder.ParentID)

	// var parentFolder models.CodeFolders
	if currentFolder.Level != "platform" {

		for i := 1; i < 100; i++ {

			currentFolder.FolderID = currentFolder.ParentID

			//Look up the parent - loop works upwards
			err := db.First(&currentFolder).Error
			if err != nil {
				log.Println("Folder construct:", err)
				return "", errors.New("Folder record not found.")
			}

			// log.Println("file path:", filepath)
			nodeFolder = false
			if currentFolder.FType == "node-folder" {
				nodeFolder = true
			}

			if subfolder != "" {

				// Add in sub folder such as pipelines:
				if currentFolder.Level == "environment" {

					/* Node folders do not have IDs attached because they need to be referenced in code */
					if nodeFolder == true {
						filepath = currentFolder.FolderName + "/" + subfolder + "/" + filepath
					} else {
						filepath = currentFolder.FolderID + "_" + currentFolder.FolderName + "/" + subfolder + "/" + filepath
					}

				} else {
					if nodeFolder == true {
						filepath = currentFolder.FolderName + "/" + filepath
					} else {
						filepath = currentFolder.FolderID + "_" + currentFolder.FolderName + "/" + filepath
					}
				}
			} else {
				if nodeFolder == true {
					filepath = currentFolder.FolderName + "/" + filepath
				} else {
					filepath = currentFolder.FolderID + "_" + currentFolder.FolderName + "/" + filepath
				}

			}

			if nodeFolder == true {
				log.Println(currentFolder.Level, nodeFolder, currentFolder.FolderID+"_"+currentFolder.FolderName+"/"+filepath)
			}

			if currentFolder.Level == "platform" {
				break
			}
		}
	}

	return filepath + "/", nil

}
