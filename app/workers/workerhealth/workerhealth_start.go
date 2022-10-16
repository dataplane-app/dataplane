package workerhealth

import (
	"log"
	"math"
	"os"
	"strconv"
	"time"

	"github.com/dataplane-app/dataplane/app/mainapp/database/models"

	"github.com/dataplane-app/dataplane/app/workers/cmetric"
	wrkerconfig "github.com/dataplane-app/dataplane/app/workers/config"
	"github.com/dataplane-app/dataplane/app/workers/logging"
	"github.com/dataplane-app/dataplane/app/workers/messageq"

	"github.com/go-co-op/gocron"
	"github.com/shirou/gopsutil/cpu"
	"github.com/shirou/gopsutil/load"
	"github.com/shirou/gopsutil/mem"
)

// type WorkerStats struct {
// 	WorkerGroup string
// 	WorkerID    string
// 	Status      string //Online, Busy
// 	T           time.Time
// 	Interval    int
// 	CPUPerc     float64
// 	Load        float64
// 	MemoryPerc  float64
// 	MemoryUsed  float64
// 	Env         string `json:"Env"`
// 	EnvID       string `json:"EnvID"`
// 	LB          string `json:"LB"`
// 	WorkerType  string `json:"WorkerType"` //container, kubernetes
// }

func WorkerHealthStart(s *gocron.Scheduler) {

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

	i, _ := strconv.Atoi(os.Getenv("DP_WORKER_HEARTBEAT_SECONDS"))

	// interval cannot be less than 1 or greater than 120
	if i < 1 || i > 120 {
		i = 5
	}

	log.Println("⏱  Heartbeat interval: " + strconv.Itoa(i) + " second(s)")

	s.Every(i).Seconds().Do(func() {
		// s.NextRun()

		// record in the database and send status to mainapp
		var percentCPUsend float64
		var percentMemorysend float64
		var memoryused float64
		switch wrkerconfig.WorkerType {

		// TODO: Fix container usage
		case "container":
			percentCPU := cmetric.CurrentCpuPercentUsage()
			percentCPUsend = percentCPU
			// cpu := docker.GetDockerIDList()
			// memory, _ := cmetric.GetContainerMemoryLimit()
			memory := cmetric.CurrentMemoryUsage()
			memoryperc := cmetric.CurrentMemoryPercentUsage()

			percentMemorysend = float64(memoryperc)
			memoryused = float64(memory)

			// // if math.IsNaN(cpu) {
			// // 	cpu = 0
			// // }
			// log.Println("Docker cpu", cpu.Percent())

			// log.Println("Memory:", utils.HumanFileSize(float64(memory)))
			// // log.Println("CPU:", cpu)
			// log.Println("Memory:", memoryperc)

			// // percentCPUsend = math.Round(cpu*100) / 100
			// percentMemorysend = math.Round(float64(memoryperc)*100) / 100
			// memoryused = math.Round((float64(memoryperc)*float64(memory))*100) / 100
		default:

			memory, _ := mem.VirtualMemory()
			percentMemorysend = math.Round(memory.UsedPercent*100) / 100
			memoryused = math.Round(float64(memory.Used)*100) / 100
			percentCPU, _ := cpu.Percent(time.Second, false)
			percentCPUsend = math.Round(percentCPU[0]*100) / 100

		}

		// log.Println("CPU:", percentCPUsend)

		load, _ := load.Avg()
		loadsend := math.Round(load.Load1*100) / 100

		// log.Printf("cpu perc:%v | mem percent:%v | mem used :%v | load:%v \n", percentCPUsend, percentMemorysend, memoryused, loadsend)

		workerdata := &models.WorkerStats{
			WorkerGroup: wrkerconfig.WorkerGroup,
			WorkerID:    wrkerconfig.WorkerID,
			Status:      "Online",
			CPUPerc:     percentCPUsend,
			MemoryPerc:  percentMemorysend,
			MemoryUsed:  memoryused,
			Load:        loadsend,
			EnvID:       wrkerconfig.EnvID,
			T:           time.Now().UTC(),
			LB:          wrkerconfig.WorkerLB,
			WorkerType:  wrkerconfig.WorkerType,
		}

		// Go type Publisher
		err := messageq.MsgSend("workergroupstats."+wrkerconfig.WorkerGroup, workerdata)
		if err != nil {
			logging.PrintSecretsRedact("NATS error:", err)
		}

		if os.Getenv("DP_METRIC_DEBUG") == "true" {
			// log.Println("Worker health: ", time.Now())
			log.Printf("cpu perc:%v | mem percent:%v | mem used :%v | load:%v \n", percentCPUsend, percentMemorysend, memoryused, loadsend)
			// log.Printf("Memory used:%v total:%v | Swap total: %v | Swap free: %v\n",
			// 	utils.ByteCountIEC(int64(memory.Used)),
			// 	utils.ByteCountIEC(int64(memory.Total)),
			// 	utils.ByteCountIEC(int64(memory.SwapTotal)),
			// 	utils.ByteCountIEC(int64(memory.SwapFree)))
		}
		// cp, _ := cpu.Info()
		// log.Println("CPU info", cp)

	})

}
