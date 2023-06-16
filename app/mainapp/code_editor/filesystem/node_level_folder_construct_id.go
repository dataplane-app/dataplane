package filesystem

import (
	"errors"
	"log"

	"github.com/dataplane-app/dataplane/app/mainapp/database"
	"github.com/dataplane-app/dataplane/app/mainapp/database/models"

	"gorm.io/gorm"
)

func NodeLevelFolderConstructByID(db *gorm.DB, id string, environmentID string) (string, error) {

	var filepath string

	var currentFolder models.CodeFolders

	err := database.DBConn.Transaction(func(tx *gorm.DB) error {

		// Needs to check that environment id is matched for security but equally when it reaches platform level is not excluded.
		err := tx.Select("folder_id", "folder_name", "parent_id", "level", "f_type").Where("folder_id=? and environment_id in (?, ?)", id, environmentID, "d_platform").First(&currentFolder).Error
		if err != nil {
			log.Println("Folder construct:", err)
			return errors.New("Folder record not found.")
		}

		if currentFolder.FolderID != id {
			return errors.New("Folder record not found.")
		}

		nodeFolder := false
		if currentFolder.FType == "node-folder" {
			nodeFolder = true
		}

		if nodeFolder == true {
			filepath = currentFolder.FolderName
		} else {
			filepath = ""
		}

		// fmt.Printf("%+v\n", currentFolder)
		// log.Println("Root:", filepath, currentFolder.ParentID)

		// var parentFolder models.CodeFolders
		rootLevel := "node"
		if currentFolder.Level == rootLevel {
			filepath = ""
		} else {

			/* ----- If not rooot level, recursive function to build */

			for i := 1; i < 50; i++ {

				currentFolder.FolderID = currentFolder.ParentID

				//Look up the parent - loop works upwards
				err := tx.First(&currentFolder).Error
				if err != nil {
					log.Println("Folder construct:", err)
					return errors.New("Folder record not found.")
				}

				// log.Println("file path:", filepath)
				nodeFolder = false
				if currentFolder.FType == "node-folder" {
					nodeFolder = true
				}

				if nodeFolder == true {
					filepath = currentFolder.FolderName + "/" + filepath
				}

				if currentFolder.Level == rootLevel {
					break
				}
			}

			filepath = "/" + filepath
		}

		return nil
	})

	if err != nil {
		return "", errors.New("Folder ID construct error:" + err.Error())
	}

	return filepath + "/", nil

}
