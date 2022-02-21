package pipelines

import (
	"dataplane/mainapp/config"
	"dataplane/mainapp/database"
	"dataplane/mainapp/database/models"
	"dataplane/mainapp/logging"
	"dataplane/mainapp/messageq"
	"encoding/json"
	"fmt"
	"log"
)

func RunNextPipeline() {

	_, err := messageq.NATSencoded.QueueSubscribe("pipeline-run-next", "runnext", func(subj, reply string, msg models.WorkerTaskSend) {

		currentNode := models.WorkerTasks{}

		// Get the current node
		err := database.DBConn.Select("node_id", "destination", "dependency", "status").Where("node_id =? and pipeline_id =? and run_id=?", msg.NodeID, msg.PipelineID, msg.RunID).First(&currentNode).Error
		if err != nil {
			logging.PrintSecretsRedact(err)
		}

		log.Println("Current node:", msg.NodeID, currentNode.Status)
		// fmt.Printf("%+v\n", currentNode)

		// Retrieve all destinations
		var destinations []string
		var uniquedependencies = make(map[string]bool)
		var uniquedependenciesarray []string
		destinationNodes := []*models.WorkerTasks{}
		dependencyCheck := []*models.WorkerTasks{}

		json.Unmarshal(currentNode.Destination, &destinations)
		// log.Println(currentNode.Destination, destinations)
		err = database.DBConn.Where("node_id in (?) and pipeline_id =? and run_id=?", destinations, msg.PipelineID, msg.RunID).Find(&destinationNodes).Error
		if err != nil {
			logging.PrintSecretsRedact(err)
		}

		for _, s := range destinationNodes {

			// log.Println("Dependencies:", s.Dependency)
			var dependencies []string
			json.Unmarshal(s.Dependency, &dependencies)
			for _, v := range dependencies {

				uniquedependencies[v] = true
			}

			for k, _ := range uniquedependencies {
				uniquedependenciesarray = append(uniquedependenciesarray, k)
			}

			log.Println("Node: ", s.NodeID, " - Dependencies to check:", uniquedependencies, uniquedependenciesarray)

			/*
				Check that destination isnt already running -
				say you have 3 dependencies but 1 destination
				this can trigger it 3 times if dependencies marked as success faster than reaching this point
				each run needs to ensure that the destination isnt already running - must be queue status to run
			*/

			err = database.DBConn.Select("node_id", "status").Where("node_id in (?) and pipeline_id =? and run_id=? and status<>?", uniquedependenciesarray, msg.PipelineID, msg.RunID, "Success").Find(&dependencyCheck).Error
			if err != nil {
				logging.PrintSecretsRedact(err)
			}

			// if err == gorm.ErrRecordNotFound {
			// 	log.Println("Dependencies check:", err)
			// }

			if len(dependencyCheck) == 0 {
				log.Println("No dependencies")

				// ------ run the destination -------
			} else {
				fmt.Printf("Dependencies: %+v\n", dependencyCheck)
			}

			// fmt.Printf("%+v\n", dependencyCheck)

		}

		// Retrieve all dependencies
		// var dependencies []string
		// json.Unmarshal(currentNode.Dependency, &dependencies)

	})

	if err != nil {
		if config.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}

	}

}
