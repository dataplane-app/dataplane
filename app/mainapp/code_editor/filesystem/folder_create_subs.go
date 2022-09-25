package filesystem

import (
	"log"
	"os"

	dpconfig "github.com/dataplane-app/dataplane/app/mainapp/config"

	"github.com/dataplane-app/dataplane/app/mainapp/database/models"

	"gorm.io/gorm"
)

/* Each environment should have:
- pipelines
- deployments

folders */
func CreateFolderSubs(db *gorm.DB, environmentID string) (string, error) {

	// Folders to create
	folders := []string{"pipelines", "deployments", "trash"}

	// Look up folder id for environment:
	var currentFolder models.CodeFolders

	// Needs to check that environment id is matched for security but equally when it reaches platform level is not excluded.
	db.Where("level=? and environment_id = ?", "environment", environmentID).First(&currentFolder)

	parentFolder, err := FolderConstructByID(db, currentFolder.FolderID, environmentID, "")
	if err != nil {
		return "fail", err
	}

	for _, n := range folders {

		createDirectory := dpconfig.CodeDirectory + parentFolder + n

		if _, err := os.Stat(createDirectory); os.IsNotExist(err) {
			// path/to/whatever does not exist
			err := os.MkdirAll(createDirectory, os.ModePerm)
			if err != nil {
				if dpconfig.Debug == "true" {
					log.Println("Create directory error:", err)
				}
			}
			if dpconfig.Debug == "true" {
				log.Println("Created sub directory: ", createDirectory)
			}

		} else {
			if dpconfig.Debug == "true" {
				log.Println("Directory already exists: ", createDirectory)
			}
		}
	}

	return "OK", nil
}
