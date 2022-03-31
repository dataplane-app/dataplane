package filesystem

import (
	"dataplane/mainapp/database/models"
	"errors"

	"gorm.io/gorm"
)

func DeployFolderConstructByID(db *gorm.DB, id string, environmentID string, subfolder string, version string) (string, error) {

	var filepath string

	var currentFolder models.DeployCodeFolders
	var pipelineFolder models.CodeFolders
	// var folderID string

	// Needs to check that environment id is matched for security but equally when it reaches platform level is not excluded.
	db.Where("folder_id=? and environment_id in (?, ?) and version =?", id, environmentID, "d_platform", version).First(&currentFolder)

	if currentFolder.FolderID != id {
		return "", errors.New("File record not found.")
	}

	var stopfolder bool

	stopfolder = false
	switch currentFolder.Level {
	case "pipeline":
		filepath = currentFolder.FolderID + "_" + currentFolder.FolderName + "/" + version
		stopfolder = true
	default:
		filepath = currentFolder.FolderID + "_" + currentFolder.FolderName
	}

	// log.Println(filepath, currentFolder.ParentID)

	// var parentFolder models.CodeFolders
	if currentFolder.Level != "platform" {

		for i := 1; i < 100; i++ {

			if stopfolder {
				break
			}

			currentFolder.FolderID = currentFolder.ParentID

			// log.Println(currentFolder.Level, filepath)
			// Looks for the parent folder
			/* If it runs at pipeline or node level use deploy folder, other wise use pipeline folder*/

			db.Where("environment_id in (?, ?) and version =?", environmentID, "d_platform", version).First(&currentFolder)

			if subfolder != "" {

				// Add in sub folder such as pipelines:
				switch currentFolder.Level {
				// case "environment":
				// 	filepath = currentFolder.FolderID + "_" + currentFolder.FolderName + "/" + subfolder + "/" + filepath
				case "pipeline":
					filepath = currentFolder.FolderID + "_" + currentFolder.FolderName + "/" + version + "/" + filepath
				default:
					filepath = currentFolder.FolderID + "_" + currentFolder.FolderName + "/" + filepath
				}

			} else {
				filepath = currentFolder.FolderID + "_" + currentFolder.FolderName + "/" + filepath
			}

			// log.Println(currentFolder.Level, filepath)

			if currentFolder.Level == "pipeline" {
				break
			}
		}

		pipelineFolder.ParentID = currentFolder.ParentID

		// Lookup the rest of the structure in pipelines
		for i := 1; i < 100; i++ {
			pipelineFolder.FolderID = pipelineFolder.ParentID
			db.First(&pipelineFolder)

			if subfolder != "" {

				// Add in sub folder such as pipelines:
				if pipelineFolder.Level == "environment" {
					filepath = pipelineFolder.FolderID + "_" + pipelineFolder.FolderName + "/" + subfolder + "/" + filepath
				} else {
					filepath = pipelineFolder.FolderID + "_" + pipelineFolder.FolderName + "/" + filepath
				}
			} else {
				filepath = pipelineFolder.FolderID + "_" + pipelineFolder.FolderName + "/" + filepath
			}

			// log.Println(pipelineFolder.Level, filepath)

			if pipelineFolder.Level == "platform" {
				break
			}

		}

	}

	return filepath + "/", nil

}
