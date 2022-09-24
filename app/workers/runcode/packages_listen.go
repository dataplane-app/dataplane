package runcodeworker

import (
	modelmain "dataplane/mainapp/database/models"
	wrkerconfig "dataplane/workers/config"
	"dataplane/workers/logging"
	"dataplane/workers/messageq"
)

func CodeLoadPackagesListen() {

	channel := "packages-update." + wrkerconfig.EnvID + "." + wrkerconfig.WorkerGroup
	messageq.NATSencoded.Subscribe(channel, func(subj, reply string, msg modelmain.CodePackages) {

		// var folder models.CodeFolders

		// err2 := database.DBConn.Select("folder_id").Where("level = ? and environment_id=? and f_type = ?", "environment", msg.EnvironmentID, "folder").First(&folder)
		// if err2.Error != nil {
		// 	log.Println(err2.Error.Error())
		// 	return
		// }

		// Get environment folder
		// envfolder, _ := filesystem.FolderConstructByID(database.DBConn, folder.FolderID, msg.EnvironmentID, "")
		// envfolder = wrkerconfig.CodeDirectory + envfolder
		envfolder := "/tmp/"

		err := CodeUpdatePackage(msg.Language, envfolder, msg.EnvironmentID, msg.WorkerGroup)
		if err != nil {
			if wrkerconfig.Debug == "true" {
				logging.PrintSecretsRedact("Listen package updates:", err)
			}
		}

	})

}
