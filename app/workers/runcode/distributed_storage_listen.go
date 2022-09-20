package runcodeworker

import (
	modelmain "dataplane/mainapp/database/models"
	wrkerconfig "dataplane/workers/config"
	"dataplane/workers/messageq"
	"log"
)

func ListenDisributedStorageDownload() {

	// Responding to a task request
	channel := "DisributedStorageDownload." + wrkerconfig.WorkerGroup + "." + wrkerconfig.WorkerID
	// log.Println("channel:", channel)
	messageq.NATSencoded.Subscribe(channel, func(subj, reply string, msg modelmain.CodeRun) {
		// log.Println("message:", msg)

		response := "ok"
		message := "ok"

		/*
			1. Download files
			2. Perform md5 check
			3. Update cache
			4. This may be used to manually sync a pipeline.
		*/

		// time.Sleep(8 * time.Second)

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
		log.Println("🎧 Listening for distributed storage download on subject:", channel)
	}

}
