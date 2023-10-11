package runcodeworker

import (
	"errors"
	"log"
	"os"

	"github.com/dataplane-app/dataplane/app/mainapp/code_editor/filesystem"
	"github.com/dataplane-app/dataplane/app/mainapp/database/models"
	"github.com/dataplane-app/dataplane/app/mainapp/messageq"
	wrkerconfig "github.com/dataplane-app/dataplane/app/workers/config"
)

/*
Listens for
* Downloads
* Folder Removal for caching
*/
func ListenDisributedStorageDownload() {

	/* -------------- FOLDER REMOVAL FOR CACHE --------- */
	channelremoval := "DisributedStorageRemoval." + wrkerconfig.EnvID + "." + wrkerconfig.WorkerGroup

	messageq.NATSencoded.Subscribe(channelremoval, func(subj, reply string, msg models.WorkerTasks) {

		response := "ok"
		message := "ok"

		x := TaskResponse{R: response, M: message}

		codeDirectory := wrkerconfig.FSCodeDirectory
		var directoryDelete = []string{}

		switch msg.RunType {
		case "pipeline":
			directoryDelete = append(directoryDelete, filesystem.PipelineRunFolderPipeline(codeDirectory, msg.EnvironmentID, msg.PipelineID))
			directoryDelete = append(directoryDelete, filesystem.CodeRunFolderPipeline(codeDirectory, msg.EnvironmentID, msg.PipelineID))
		case "deployment":
			directoryDelete = append(directoryDelete, filesystem.DeployRunFolderPipeline(codeDirectory, msg.EnvironmentID, msg.PipelineID, msg.Version))
		default:
			errdir := errors.New("level not provided")
			x.R = "fail"
			x.M = errdir.Error()
		}

		if wrkerconfig.Debug == "true" {
			log.Println("Received folder for deletion:", directoryDelete)
		}

		for _, d := range directoryDelete {
			if d != "" {
				errfs := os.RemoveAll(d)
				if errfs != nil {
					log.Println(errfs)
					x.R = "fail"
					x.M = errfs.Error()
				}
			} else {
				errdir := errors.New("Directory delete - empty folder")
				x.R = "fail"
				x.M = errdir.Error()
			}
		}

		//Send back response
		err := messageq.NATSencoded.Publish(reply, x)
		if err != nil {
			log.Println(err.Error())
		}

	})

	if wrkerconfig.Debug == "true" {
		log.Println("🎧 Listening for distributed storage on subject(s):", channelremoval)
	}

}
