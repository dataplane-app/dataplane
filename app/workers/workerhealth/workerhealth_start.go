package workerhealth

import (
	"dataplane/workers/logging"
	"dataplane/workers/messageq"
	"dataplane/workers/utils"
	"log"
	"math"
	"os"
	"strconv"
	"time"

	"github.com/go-co-op/gocron"
	"github.com/google/uuid"
	"github.com/shirou/gopsutil/cpu"
	"github.com/shirou/gopsutil/load"
	"github.com/shirou/gopsutil/mem"
)

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

type Worker struct {
	WorkerGroup string    `json:"WorkerGroup"`
	WorkerID    string    `json:"WorkerID"`
	Status      string    `json:"Status"` //Online, busy
	T           time.Time `json:"T"`
	Env         string    `json:"Env"`
	LB          string    `json:"LB"`
	WorkerType  string    `json:"WorkerType"` //container, kubernetes
}

var WorkerID string

func WorkerHealthStart() {

	// Load a worker ID
	WorkerID = uuid.NewString()

	/* Register the worker with mainapp */
	worker := Worker{
		WorkerGroup: os.Getenv("worker_group"),
		WorkerID:    WorkerID,
		Status:      "Online",
		T:           time.Now().UTC(),
	}

	// data, err := json.Marshal(worker)
	// if err != nil {
	// 	log.Println(err)
	// }

	// var response WorkerResponse

	// log.Println("Response:", response)

	// if response.Response != "ok" {
	// 	log.Println("Failed to register worker with mainapp")
	// }

	/* Start the worker heart beat */
	s := gocron.NewScheduler(time.UTC)

	log.Println("Submitting workers")
	WorkerLoad(s)

	i, _ := strconv.Atoi(os.Getenv("worker_heartbeat_seconds"))

	// interval cannot be less than 1 or greater than 120
	if i < 1 || i > 120 {
		i = 5
	}

	log.Println("⏱  Heartbeat interval: " + strconv.Itoa(i) + " second(s)")

	s.Every(i).Seconds().Do(func() {
		// s.NextRun()

		// record in the database and send status to mainapp
		percentCPU, _ := cpu.Percent(time.Second, false)
		percentCPUsend := math.Round(percentCPU[0]*100) / 100

		memory, _ := mem.VirtualMemory()
		percentMemorysend := math.Round(memory.UsedPercent*100) / 100
		memoryused := math.Round(float64(memory.Used)*100) / 100

		load, _ := load.Avg()
		loadsend := math.Round(load.Load1*100) / 100

		workerdata := &WorkerStats{
			WorkerGroup: os.Getenv("worker_group"),
			WorkerID:    WorkerID,
			Status:      "Online",
			CPUPerc:     percentCPUsend,
			MemoryPerc:  percentMemorysend,
			MemoryUsed:  memoryused,
			Load:        loadsend,
			T:           time.Now().UTC(),
			Interval:    i,
			Env:         os.Getenv("worker_env"),
			LB:          os.Getenv("worker_lb"),
			WorkerType:  os.Getenv("worker_type"),
		}

		// Go type Publisher
		err := messageq.MsgSend("workerstats."+worker.WorkerGroup, workerdata)
		if err != nil {
			logging.PrintSecretsRedact("NATS error:", err)
		}

		if os.Getenv("messagedebug") == "true" {
			// log.Println("Worker health: ", time.Now())
			log.Printf("cpu perc:%v | mem percent:%v | load:%v \n", percentCPUsend, percentMemorysend, loadsend)
			log.Printf("Memory used:%v total:%v | Swap total: %v | Swap free: %v\n",
				utils.ByteCountIEC(int64(memory.Used)),
				utils.ByteCountIEC(int64(memory.Total)),
				utils.ByteCountIEC(int64(memory.SwapTotal)),
				utils.ByteCountIEC(int64(memory.SwapFree)))
		}
		// cp, _ := cpu.Info()
		// log.Println("CPU info", cp)

	})

	s.StartAsync()
}
