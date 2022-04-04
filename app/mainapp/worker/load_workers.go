package worker

import (
	"dataplane/mainapp/database"
	"dataplane/mainapp/database/models"
	"dataplane/mainapp/logging"
	"dataplane/mainapp/messageq"
	"encoding/json"
	"time"

	"github.com/nats-io/nats.go"
	"github.com/tidwall/buntdb"
)

func LoadWorkers(MainAppID string) {

	// ---- Worker Group ------

	// var workerdata Worker
	var workerdatajson []byte
	var workerdata models.WorkerStats
	var workerGroupdatajson []byte
	var workerGroupdata models.WorkerGroup

	messageq.NATSencoded.Subscribe("workerload", func(m *nats.Msg) {

		// if config.MQDebug == "true" {
		// 	logging.PrintSecretsRedact(string(m.Data))
		// }

		// Reset the data to keep clean
		workerdatajson = []byte("")

		workerdatajson = m.Data

		if string(workerdatajson) != "" {

			// log.Println("---------------------------")
			// log.Println("worker json stats", string(workerdatajson))

			err := json.Unmarshal(workerdatajson, &workerdata)
			if err != nil {
				logging.PrintSecretsRedact(err)
			}

			err = json.Unmarshal(workerdatajson, &workerGroupdata)
			if err != nil {
				logging.PrintSecretsRedact(err)
			}

			workerGroupdatajson, err = json.Marshal(&workerGroupdata)
			if err != nil {
				logging.PrintSecretsRedact(err)
			}

			workerGroup := workerdata.WorkerGroup
			workerID := workerdata.WorkerID

			// ---- Adding a new worker?

			// ---- Update worker group
			database.GoDBWorkerGroup.Update(func(tx *buntdb.Tx) error {
				tx.Set(workerGroup, string(workerGroupdatajson), &buntdb.SetOptions{Expires: true, TTL: 5 * time.Second})
				return nil
			})

			// ---- Update worker
			database.GoDBWorker.Update(func(tx *buntdb.Tx) error {
				tx.Set(workerID, string(workerdatajson), &buntdb.SetOptions{Expires: true, TTL: 5 * time.Second})
				return nil
			})

			// log.Println("worker:", string(workerdatajson))
			// log.Println("workergroup:", string(workerGroupdatajson))

		}

	})

}
