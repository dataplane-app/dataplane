package runcodeworker

import (
	wrkerconfig "dataplane/workers/config"
	"dataplane/workers/messageq"
	"log"
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
		log.Println("Received folder for deletion:", parentFolder)

		response := "ok"
		message := "ok"

		//Remove folder for this worker

		//Send back response
		x := TaskResponse{R: response, M: message}
		err := messageq.NATSencoded.Publish(reply, x)

		if err != nil {
			x.R = "fail"
			x.M = err.Error()
			log.Println(err.Error())
		}

		if x.R == "ok" {

		}
	})

	if wrkerconfig.Debug == "true" {
		log.Println("🎧 Listening for distributed storage on subject(s):", channelremoval)
	}

}
