package main

import (
	"fmt"
	"log"
	"os/exec"
	"strconv"
	"strings"
	"time"

	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/mem"
)

// ONLY an issue on docker compose locally on Mac - maybe latest version of docker using cgroup v2 - not an isssue with using kubernetes.

func main() {

	// cmd = exec.Command("/bin/bash", "-c", "stat -fc %T /sys/fs/cgroup/")
	out, err := exec.Command("/bin/bash", "-c", "stat -fc %T /sys/fs/cgroup/").Output()
	if err != nil {
		log.Fatal(err)
	}

	log.Println("--" + string(out) + "--")

	if strings.TrimSuffix(string(out), "\n") == "cgroup2fs" {
		log.Println("CGroup v2")
	} else {
		log.Println("CGroup v1")
	}

	// Is this using cgroup v2
	// path :=
	// v, err := ioutil.ReadFile(path)
	// if err != nil {
	// 	return 0, err
	// }

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

		d, _ := cpu.Counts(false)
		fmt.Println("CPU:", d)
		// cpu := cmetric.CurrentCpuPercentUsage()
		// fmt.Println("cpu ", cpu)
		memlimitstring, err := exec.Command("/bin/bash", "-c", "cat /sys/fs/cgroup/memory.max").Output()
		if err != nil {
			log.Fatal(err)
		}

		memCurrentString, err := exec.Command("/bin/bash", "-c", "cat /sys/fs/cgroup/memory.current").Output()
		if err != nil {
			log.Fatal(err)
		}

		fmt.Println("memory raw:", string(memlimitstring), string(memCurrentString))

		var memlimit float64
		var memcurrent float64

		// If cat /sys/fs/cgroup/memory.max = max then no memory limit was provided.
		if strings.TrimSuffix(string(memlimitstring), "\n") == "max" {
			memlimit = -1
		}

		v, _ := mem.VirtualMemory()
		fmt.Printf("Total: %v, Free:%v, UsedPercent:%f%%, Used: %vMB, Shared: %vMB, Cached: %vMB\n", v.Total, v.Free, v.UsedPercent, v.Used/1024/1024, v.Shared/1024/1024, v.Cached/1024/1024)
		// fmt.Println(v.String())

		memlimit, _ = strconv.ParseFloat(strings.TrimSuffix(string(memlimitstring), "\n"), 64)
		memcurrent, _ = strconv.ParseFloat(strings.TrimSuffix(string(memCurrentString), "\n"), 64)
		fmt.Println("mem limit:", strconv.FormatFloat(memlimit/1024/1024, 'f', -1, 64)+"MB",
			"|", "mem use:", strconv.FormatFloat(memcurrent/1024/1024, 'f', -1, 64)+"MB",
			"|", "mem %:", strconv.FormatFloat(memcurrent/memlimit, 'f', -1, 64))

		time.Sleep(2000 * time.Millisecond)
	}

}

// getSystemCPUUsage returns the host system's cpu usage in
// nanoseconds. An error is returned if the format of the underlying
// file does not match.
//
// Uses /proc/stat defined by POSIX. Looks for the cpu
// statistics line and then sums up the first seven fields
// provided. See `man 5 proc` for details on specific field
// information.
const nanoSecondsPerSecond = 1e9

// func (s *statsCollector) getSystemCPUUsage() (uint64, error) {
// 	var line string
// 	f, err := os.Open("/proc/stat")
// 	if err != nil {
// 		return 0, err
// 	}
// 	defer func() {
// 		s.bufReader.Reset(nil)
// 		f.Close()
// 	}()
// 	s.bufReader.Reset(f)
// 	err = nil
// 	for err == nil {
// 		line, err = s.bufReader.ReadString('\n')
// 		if err != nil {
// 			break
// 		}
// 		parts := strings.Fields(line)
// 		switch parts[0] {
// 		case "cpu":
// 			if len(parts) < 8 {
// 				return 0, errors.New("ErrorCodeBadCPUFields")
// 			}
// 			var totalClockTicks uint64
// 			for _, i := range parts[1:8] {
// 				v, err := strconv.ParseUint(i, 10, 64)
// 				if err != nil {
// 					return 0, err
// 				}
// 				totalClockTicks += v
// 			}
// 			return (totalClockTicks * nanoSecondsPerSecond) /
// 				s.clockTicksPerSecond, nil
// 		}
// 	}
// 	return 0, errors.New("ErrorCodeBadStatFormat")
// }
