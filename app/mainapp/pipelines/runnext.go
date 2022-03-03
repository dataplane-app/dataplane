package pipelines

import (
	"dataplane/mainapp/config"
	"dataplane/mainapp/database"
	"dataplane/mainapp/database/models"
	"dataplane/mainapp/logging"
	"dataplane/mainapp/messageq"
	"dataplane/mainapp/worker"
	"encoding/json"
	"time"

	"gorm.io/gorm/clause"
)

func RunNextPipeline() {

	_, err := messageq.NATSencoded.QueueSubscribe("pipeline-run-next", "runnext", func(subj, reply string, msg models.WorkerTaskSend) {

		currentNode := models.WorkerTasks{}

		// Get the current node
		err := database.DBConn.Select("node_id", "destination", "dependency", "status").Where("node_id =? and pipeline_id =? and run_id=?", msg.NodeID, msg.PipelineID, msg.RunID).First(&currentNode).Error
		if err != nil {
			logging.PrintSecretsRedact(err)
		}

		// fmt.Printf("%+v\n", currentNode)

		// Retrieve all destinations
		var destinations []string
		var uniquedependencies = make(map[string]bool)
		var uniquedependenciesarray []string
		destinationNodes := []*models.WorkerTasks{}
		dependencyCheck := []*models.WorkerTasks{}
		completeCheck := []*models.WorkerTasks{}

		json.Unmarshal(currentNode.Destination, &destinations)
		// log.Println(currentNode.Destination, destinations)
		err = database.DBConn.Where("node_id in (?) and pipeline_id =? and run_id=? and status= ?", destinations, msg.PipelineID, msg.RunID, "Queue").Find(&destinationNodes).Error
		if err != nil {
			logging.PrintSecretsRedact(err)
		}

		// if there are no destinations and the last run was a success, then close off the run

		/* The above query pulls out all the destinations data at queue status so say the the last 3 dependencies come to a single
		point [1, 2, 3] > 4 - this will arrive 3 times but only the first will run as destination 4 will be success or at run status.

		the first destination will run the */
		// log.Println("Current node:", msg.NodeID, currentNode.Status, currentNode.Destination, len(destinationNodes))

		if string(currentNode.Destination) == "null" && currentNode.Status == "Success" {

			// log.Println("Graph successfully run")

			/* Check that all nodes are completed */
			err = database.DBConn.Select("node_id", "status").Where("pipeline_id =? and run_id=? and status<>?", msg.PipelineID, msg.RunID, "Success").Find(&completeCheck).Error
			if err != nil {
				logging.PrintSecretsRedact(err)
			}

			if len(completeCheck) == 0 {
				run := models.PipelineRuns{
					RunID:   msg.RunID,
					Status:  "Success",
					EndedAt: time.Now().UTC(),
				}

				err2 := database.DBConn.Clauses(clause.OnConflict{
					Columns:   []clause.Column{{Name: "run_id"}},
					DoUpdates: clause.AssignmentColumns([]string{"ended_at", "status"}),
				}).Create(&run)
				if err2.Error != nil {
					logging.PrintSecretsRedact(err2.Error.Error())
				}

				// send message that trigger node has run - for websockets
				errnat := messageq.MsgSend("taskupdate."+msg.EnvironmentID+"."+msg.RunID, map[string]interface{}{
					"MSG":        "pipeline_complete",
					"run_id":     msg.RunID,
					"started_at": run.CreatedAt,
					"status":     "Success",
					"ended_at":   run.EndedAt})
				if errnat != nil {
					if config.Debug == "true" {
						logging.PrintSecretsRedact(errnat)
					}

				}
			}

		}

		// If not at the end then continue with pipeline

		for _, s := range destinationNodes {

			// log.Println("Destination:", s.RunID, " -> ", s.NodeID)

			var dependencies []string
			json.Unmarshal(s.Dependency, &dependencies)
			for _, v := range dependencies {

				uniquedependencies[v] = true
			}

			for k, _ := range uniquedependencies {
				uniquedependenciesarray = append(uniquedependenciesarray, k)
			}

			// log.Println("Node: ", s.NodeID, " - Dependencies to check:", uniquedependencies, uniquedependenciesarray)

			/*
				Check that destination isnt already running -
				say you have 3 dependencies but 1 destination
				this can trigger it 3 times if dependencies marked as success faster than reaching this point
				each run needs to ensure that the destination isnt already running - must be queue status to run

				All dependencies need to be marked as success to continue. The below look for any non-successful nodes.
				If any return then there are still outstanding dependencies.
			*/

			err = database.DBConn.Select("node_id", "status").Where("node_id in (?) and pipeline_id =? and run_id=? and status<>?", uniquedependenciesarray, msg.PipelineID, msg.RunID, "Success").Find(&dependencyCheck).Error
			if err != nil {
				logging.PrintSecretsRedact(err)
			}

			// if err == gorm.ErrRecordNotFound {
			// 	log.Println("Dependencies check:", err)
			// }

			if len(dependencyCheck) == 0 {

				commandsJson := []Command{}
				commandsend := []string{}

				// log.Println("All dependencies are successful")
				json.Unmarshal(s.Commands, &commandsJson)

				for _, c := range commandsJson {
					commandsend = append(commandsend, c.Command)
				}

				// ------ run the destination -------
				err = worker.WorkerRunTask(s.WorkerGroup, s.TaskID, s.RunID, s.EnvironmentID, s.PipelineID, s.NodeID, commandsend)
				// err = worker.WorkerRunTask("python_1", triggerData[s].TaskID, RunID, environmentID, pipelineID, s, []string{"echo " + s})
				if err != nil {
					if config.Debug == "true" {
						logging.PrintSecretsRedact(err)
					}

				} else {
					if config.Debug == "true" {
						logging.PrintSecretsRedact("Next step:", s.RunID, " -> ", s.TaskID)
					}
				}

			} else {

				// These dependencies are either failed or not yet complete.
				// fmt.Printf("Dependencies: %+v\n", &dependencyCheck)
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
