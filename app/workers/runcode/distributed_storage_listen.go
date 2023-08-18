package runcodeworker

import (
	"log"
	"os"
	"strings"

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
	channelremoval := "DisributedStorageRemoval." + wrkerconfig.WorkerGroup

	messageq.NATSencoded.Subscribe(channelremoval, func(subj, reply string, parentFolder string) {

		if wrkerconfig.Debug == "true" {
			log.Println("Received folder for deletion:", parentFolder)
		}

		response := "ok"
		message := "ok"

		x := TaskResponse{R: response, M: message}

		if strings.Contains(parentFolder, "_Platform") == false {
			log.Println("Folder incorrect format - doesn't contain _Platform")
			x.R = "fail"
			x.M = "Folder incorrect format - doesn't contain _Platform"

		} else {

			//Remove folder for this worker
			if wrkerconfig.Debug == "true" {
				log.Println("Remove cached folders: ", wrkerconfig.FSCodeDirectory+parentFolder)
			}

			errfs := os.RemoveAll(wrkerconfig.FSCodeDirectory + parentFolder)
			if errfs != nil {
				log.Println(errfs)
				x.R = "fail"
				x.M = errfs.Error()
			}
		}

		//Send back response
		err := messageq.NATSencoded.Publish(reply, x)
		if err != nil {
			log.Println(err.Error())
		}

		if x.R == "ok" {

		}
	})

	if wrkerconfig.Debug == "true" {
		log.Println("🎧 Listening for distributed storage on subject(s):", channelremoval)
	}

}
