package runcodeworker

import (
	"dataplane/mainapp/code_editor/filesystem"
	"dataplane/mainapp/database/models"
	"dataplane/workers/config"
	"dataplane/workers/database"
	"log"
	"strings"
)

func CodeLoadPackages(language string, loadpackages string, environmentID string, workerGroup string) {

	var folder models.CodeFolders

	err2 := database.DBConn.Select("folder_id").Where("level = ? and environment_id=? and f_type = ?", "environment", environmentID, "folder").First(&folder)
	if err2.Error != nil {
		log.Println(err2.Error.Error())
		return
	}

	// get all the packages
	languagesplit := strings.Split(language, ",")

	// Get environment folder
	envfolder, _ := filesystem.FolderConstructByID(database.DBConn, folder.FolderID, environmentID, "")
	envfolder = config.CodeDirectory + envfolder

	for _, v := range languagesplit {

		if strings.Contains(loadpackages, v) {
			err := CodeUpdatePackage(v, envfolder, environmentID, workerGroup)
			if err != nil {
				continue
			}

		}

	}

}
