package main

import (
	"dataplane/workers/cmetric"
	"fmt"
	"time"
)

func main() {
	go func() {
	restart:
		t := time.NewTicker(6 * time.Second)

		for {
			select {
			case <-t.C:
				fmt.Println("cpu down===========")
				time.Sleep(6 * time.Second)
				t.Stop()
				fmt.Println("cpu up===========")
				goto restart
			default:

			}
		}
	}()

	for {
		cpu := cmetric.CurrentCpuPercentUsage()
		fmt.Println("cpu ", cpu)
		memory := cmetric.CurrentMemoryPercentUsage()
		fmt.Println("memory ", memory)
		time.Sleep(2000 * time.Millisecond)
	}

}
