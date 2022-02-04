package worker

import (
	"dataplane/mainapp/database"
	"dataplane/mainapp/logging"
	"dataplane/mainapp/messageq"
	"encoding/json"
	"time"

	"github.com/nats-io/nats.go"
	"github.com/tidwall/buntdb"
)

type workerResponse struct {
	Response  string
	MainAppID string
}

type WorkerStats struct {
	WorkerGroup string
	WorkerID    string
	Status      string //Online, Busy
	T           time.Time
	Interval    int
	CPUPerc     float64
	Load        float64
	MemoryPerc  float64
	MemoryUsed  float64
	Env         string `json:"Env"`
	LB          string `json:"LB"`
	WorkerType  string `json:"WorkerType"` //container, kubernetes
}

type WorkerGroup struct {
	WorkerGroup string
	Status      string //Online, Busy
	T           time.Time
	Interval    int
	Env         string `json:"Env"`
	LB          string `json:"LB"`
	WorkerType  string `json:"WorkerType"` //container, kubernetes
}

func LoadWorkers(MainAppID string) {

	// ---- Worker Group ------

	// var workerdata Worker
	var workerdatajson []byte
	var workerdata WorkerStats
	var workerGroupdatajson []byte
	var workerGroupdata WorkerGroup

	messageq.NATSencoded.Subscribe("workerload", func(m *nats.Msg) {
		// if os.Getenv("messagedebug") == "true" {
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

			// log.Println(string(workerGroupdatajson))

			// log.Println("---------------------------")

		}

		// database.GoDBWorkerGroup.View(func(tx *buntdb.Tx) error {
		// 	tx.Ascend("", func(key, val string) bool {
		// 		fmt.Printf("Worker Groups: %s %s\n", key, val)
		// 		return true
		// 	})
		// 	return nil
		// })

		// log.Println("======================")

		// database.GoDBWorker.View(func(tx *buntdb.Tx) error {
		// 	tx.Ascend("", func(key, val string) bool {
		// 		fmt.Printf("Worker: %s %s\n", key, val)
		// 		return true
		// 	})
		// 	return nil
		// })

		// log.Println(LoadedWorkers)

	})

}

// // ----- remove after 3 seconds
// var delkeys []string
// deleteTime := time.Now().UTC().Add(-3 * time.Second).Unix()
// db.View(func(tx *buntdb.Tx) error {
// tx.Len("object:*", func(k, v string) bool {
// 	if someCondition(k) == true {
// 		delkeys = append(delkeys, k)
// 	}
// 	return true // continue
// })

// LoadedWorkers[workerdata.WorkerGroup] = Worker{
// 	WorkerGroup: workerdata.WorkerGroup,
// 	WorkerID:    workerdata.WorkerID,
// 	Status:      workerdata.Status,
// 	T:           workerdata.T,
// 	Updated:     time.Now(),
// }

/* Worker Load Subscriptions activate */
// messageq.NATS.Subscribe("workerload", func(m *nats.Msg) {
// 	// sendjson, _ := json.Marshal(`{"response":"ok"}`)

// 	var workerdata Worker

// 	// log.Println(string(m.Data))

// 	err := json.Unmarshal(m.Data, &workerdata)

// 	if err != nil {
// 		logging.PrintSecretsRedact(err)
// 	}

// 	// log.Println(workerdata)

// 	LoadedWorkers[workerdata.WorkerGroup] = Worker{
// 		WorkerGroup: workerdata.WorkerGroup,
// 		WorkerID:    workerdata.WorkerID,
// 		Status:      workerdata.Status,
// 		T:           workerdata.T,
// 		Updated:     time.Now(),
// 	}

// 	// log.Println(LoadedWorkers)

// 	send := workerResponse{
// 		Response:  "ok",
// 		MainAppID: MainAppID,
// 	}
// 	messageq.NATSencoded.Publish(m.Reply, send)
// 	if os.Getenv("messagedebug") == "true" {
// 		log.Println(string(m.Data))
// 	}
// })

/* Ping any active workers while starting up */
