package workerhealth

import (
	"log"
	"math"
	"os"
	"time"

	"github.com/dataplane-app/dataplane/app/mainapp/database/models"

	wrkerconfig "github.com/dataplane-app/dataplane/app/workers/config"
	"github.com/dataplane-app/dataplane/app/workers/messageq"

	"github.com/go-co-op/gocron"
	"github.com/shirou/gopsutil/cpu"
	"github.com/shirou/gopsutil/load"
	"github.com/shirou/gopsutil/mem"
)

type WorkerResponse struct {
	Response  string
	MainAppID string
}

func WorkerLoad(s *gocron.Scheduler) {
	/* Reply to mainapp request */

	s.Every(1000).Milliseconds().Do(func() {

		percentCPU, _ := cpu.Percent(time.Second, false)
		percentCPUsend := math.Round(percentCPU[0]*100) / 100

		memory, _ := mem.VirtualMemory()
		percentMemorysend := math.Round(memory.UsedPercent*100) / 100
		memoryused := math.Round(float64(memory.Used)*100) / 100

		load, _ := load.Avg()
		loadsend := math.Round(load.Load1*100) / 100

		send := models.WorkerStats{
			WorkerGroup: wrkerconfig.WorkerGroup,
			WorkerID:    wrkerconfig.WorkerID,
			Status:      "Online",
			CPUPerc:     percentCPUsend,
			MemoryPerc:  percentMemorysend,
			MemoryUsed:  memoryused,
			Load:        loadsend,
			EnvID:       wrkerconfig.EnvID,
			LB:          wrkerconfig.WorkerLB,
			WorkerType:  wrkerconfig.WorkerType,
		}
		messageq.NATSencoded.Publish("workerloadv2", send)
		if os.Getenv("DP_WORKER_DEBUG") == "true" {
			log.Println("sending:", send)
		}

	})

}
