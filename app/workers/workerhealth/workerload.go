package workerhealth

import (
	"log"
	"math"
	"os"
	"time"

	"github.com/dataplane-app/dataplane/app/mainapp/database/models"
	"github.com/dataplane-app/dataplane/app/mainapp/messageq"

	wrkerconfig "github.com/dataplane-app/dataplane/app/workers/config"

	"github.com/shirou/gopsutil/cpu"
	"github.com/shirou/gopsutil/load"
	"github.com/shirou/gopsutil/mem"
)

type WorkerResponse struct {
	Response  string
	MainAppID string
}

func WorkerLoad() {
	/* Reply to mainapp request */

	ticker := time.NewTicker(1 * time.Second)
	quit := make(chan struct{})

	// func q(){
	//
	// 	return
	// }

	// defer q()

	go func() {
		for {
			select {

			case <-ticker.C:
				// log.Println("Send worker load")

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

			case <-quit:
				ticker.Stop()
				return
			}
		}
	}()

	// s.Every(1000).Milliseconds().Do(func() {

	// })

}
