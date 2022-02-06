package worker

import (
	"dataplane/mainapp/database"
	"dataplane/mainapp/database/models"
	"dataplane/mainapp/logging"
	"dataplane/mainapp/utilities"
	"encoding/json"
	"errors"
	"log"
	"os"
	"strconv"
	"time"

	"github.com/tidwall/buntdb"
)

func WorkerRunTask(workerGroup string, taskid string, commands []string) error {

	// var val string
	// var err error
	/* Look up chosen workerGroup -
	if none, keep trying for 10 x 2 seconds
	before failing */
	// maxRetiresAllowed := 5
	// for i := 0; i < maxRetiresAllowed; i++ {

	// 	database.GoDBWorkerGroup.View(func(tx *buntdb.Tx) error {
	// 		val, err = tx.Get(workerGroup)
	// 		if err != nil {
	// 			return err
	// 		}
	// 		fmt.Printf("value is %s\n", val)
	// 		return nil
	// 	})

	// 	if err == buntdb.ErrNotFound {
	// 		log.Println(workerGroup + " not online, retrying in 2 seconds (" + strconv.Itoa(i) + " of " + strconv.Itoa(maxRetiresAllowed) + ")")
	// 	} else {
	// 		break
	// 	}

	// 	// log.Println(val, err)

	// 	time.Sleep(2 * time.Second)

	// }

	// if err != nil {
	// 	return errors.New("Worker group not online: " + workerGroup)
	// }

	/* Look up chosen workers -
	if none, keep trying for 10 x 2 seconds
	before failing */
	// var err1 error
	maxRetiresAllowed := 5
	var onlineWorkers []models.WorkerStats
	for i := 0; i < maxRetiresAllowed; i++ {

		database.GoDBWorker.View(func(tx *buntdb.Tx) error {
			tx.AscendEqual("workergroup", `{"WorkerGroup":"`+workerGroup+`"}`, func(key, val string) bool {

				// `{"WorkerGeroup":"`+workerGroup+`"}`,

				var worker models.WorkerStats

				// log.Println("Workers:", key, val)

				err := json.Unmarshal([]byte(val), &worker)
				if err != nil {
					logging.PrintSecretsRedact(err)
				}
				onlineWorkers = append(onlineWorkers, worker)
				return true

			})

			return nil
		})

		// log.Println("X:", len(onlineWorkers))

		// log.Println("err1:", err1)

		if len(onlineWorkers) == 0 {
			log.Println(workerGroup + " not online, retrying in 2 seconds (" + strconv.Itoa(i) + " of " + strconv.Itoa(maxRetiresAllowed) + ")")
		} else {
			break
		}

		time.Sleep(2 * time.Second)
	}

	if len(onlineWorkers) == 0 {
		return errors.New("Worker group not online: " + workerGroup)
	}

	// Choose a worker based on load balancing strategy - default is round robin
	switch onlineWorkers[0].LB {
	case "roundrobin":

		loadbalanceNext := utilities.Balance(onlineWorkers, workerGroup)
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact("round robin: ", loadbalanceNext)
		}
	default:
		loadbalanceNext := utilities.Balance(onlineWorkers, workerGroup)
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact("round robin: ", loadbalanceNext)
		}
	}

	// Send the request to the worker

	//
	return nil

}
