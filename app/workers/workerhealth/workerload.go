package workerhealth

import (
	"dataplane/workers/config"
	"dataplane/workers/messageq"
	"log"
	"math"
	"os"
	"time"

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

	s.Every(1).Seconds().Do(func() {

		percentCPU, _ := cpu.Percent(time.Second, false)
		percentCPUsend := math.Round(percentCPU[0]*100) / 100

		memory, _ := mem.VirtualMemory()
		percentMemorysend := math.Round(memory.UsedPercent*100) / 100
		memoryused := math.Round(float64(memory.Used)*100) / 100

		load, _ := load.Avg()
		loadsend := math.Round(load.Load1*100) / 100

		send := WorkerStats{
			WorkerGroup: os.Getenv("worker_group"),
			WorkerID:    config.WorkerID,
			Status:      "Online",
			CPUPerc:     percentCPUsend,
			MemoryPerc:  percentMemorysend,
			MemoryUsed:  memoryused,
			Load:        loadsend,
			Interval:    1,
			T:           time.Now().UTC(),
			Env:         os.Getenv("worker_env"),
			LB:          os.Getenv("worker_lb"),
			WorkerType:  os.Getenv("worker_type"),
		}
		messageq.NATSencoded.Publish("workerload", send)
		if os.Getenv("messagedebug") == "true" {
			log.Println("sending:", send)
		}

	})

}
