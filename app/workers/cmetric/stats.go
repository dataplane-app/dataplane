package cmetric

import (
	"bufio"
	"context"
	"log"
	"math"
	"os"
	"runtime"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"github.com/shirou/gopsutil/mem"
	"github.com/shirou/gopsutil/process"
)

const (
	NotRetrievedCpuUsageValue float64 = -1.0
	NotRetrievedMemoryValue   float32 = -1
	CGroupPath                        = "/proc/1/cgroup"
	DockerPath                        = "/docker"
	KubepodsPath                      = "/kubepods"

	cgroupCpuQuotaPath  = "/sys/fs/cgroup/cpu/cpu.cfs_quota_us"
	cgroupCpuPeriodPath = "/sys/fs/cgroup/cpu/cpu.cfs_period_us"
	memoryPath          = "/sys/fs/cgroup/memory/memory.limit_in_bytes"
	memoryUsage         = "/sys/fs/cgroup/memory/memory.usage_in_bytes"
)

var (
	cpuPercentUsage    atomic.Value //  avg cpu percent in multi cpu core 100% is the max percent
	memoryPercentUsage atomic.Value // 100% is the max percent
	memoryUsagebytes   atomic.Value

	memoryStatCollectorOnce sync.Once
	cpuStatCollectorOnce    sync.Once

	CurrentPID         = os.Getpid()
	currentProcess     atomic.Value
	currentProcessOnce sync.Once

	memoryRetrieveDuration time.Duration

	cpuRetrieveDuration time.Duration

	ssStopChan = make(chan struct{})

	isContainer bool
	cpuCount    float64
)

func init() {

	// log.Println("Start - container", isContainerRunning())
	cpuPercentUsage.Store(NotRetrievedCpuUsageValue)
	memoryPercentUsage.Store(NotRetrievedMemoryValue)

	p, err := process.NewProcess(int32(CurrentPID))
	if err != nil {
		log.Println(err, "Fail to new process when initializing system metric", "pid", CurrentPID)
		return
	}
	currentProcessOnce.Do(func() {
		currentProcess.Store(p)
	})

	if cpuRetrieveDuration == 0 {
		cpuRetrieveDuration = 1000 * time.Millisecond
	}

	if memoryRetrieveDuration == 0 {
		memoryRetrieveDuration = 1000 * time.Millisecond
	}

	isContainer = true //isContainerRunning()
	cpuCount = float64(runtime.NumCPU())
	if isContainer {
		cpuCount, err = getContainerCpuCount()
		// log.Println("environment is  container - cpus: ", cpuCount)
		if err != nil {
			log.Println(err, "Fail to getContainerCpuCount when initializing system metric")
			return
		}
	}
	initCpuCollector(cpuRetrieveDuration)
	initMemoryCollector(memoryRetrieveDuration)
}

func isContainerRunning() bool {
	f, err := os.Open(CGroupPath)
	if err != nil {
		log.Println("Hello")
		return false
	}
	defer f.Close()
	buff := bufio.NewReader(f)
	for {
		line, _, err := buff.ReadLine()
		if err != nil {
			return false
		}
		if strings.Contains(string(line), DockerPath) ||
			strings.Contains(string(line), KubepodsPath) {
			return true
		}
	}
}

func getContainerCpuCount() (float64, error) {

	cpuPeriod, err := readUint(cgroupCpuPeriodPath)
	if err != nil {
		return 0, err
	}

	cpuQuota, err := readUint(cgroupCpuQuotaPath)
	if err != nil {
		return 0, err
	}

	cpuCore := float64(cpuQuota) / float64(cpuPeriod)

	// log.Println("cpu count:", cpuPeriod, cpuQuota, cpuCore)

	return cpuCore, nil
}

func initCpuCollector(d time.Duration) {
	if d == 0 {
		return
	}
	retrieveAndUpdateCpuStat()

	go func() {
		cpuStatCollectorOnce.Do(func() {

			ticker := time.NewTicker(d)
			for {
				select {
				case <-ticker.C:
					retrieveAndUpdateCpuStat()
				case <-ssStopChan:
					ticker.Stop()
					return
				}
			}
		})
	}()
}

func retrieveAndUpdateCpuStat() {
	var (
		cpuPercent float64
		err        error
	)

	cpuPercent, err = getProcessCpuStat()
	if err != nil {
		log.Println(err)
		return
	}
	// get avg cpu percent in multi cpu core 100% is the max percent
	cpuPercentUsage.Store(cpuPercent / cpuCount)
}

func getProcessCpuStat() (float64, error) {
	curProcess := currentProcess.Load()
	if curProcess == nil {
		p, err := process.NewProcess(int32(CurrentPID))
		if err != nil {
			return 0, err
		}
		currentProcessOnce.Do(func() {
			currentProcess.Store(p)
		})
		curProcess = currentProcess.Load()
	}
	p := curProcess.(*process.Process)
	return p.Percent(0)
}

func CurrentCpuPercentUsage() float64 {
	r, ok := cpuPercentUsage.Load().(float64)
	if !ok {
		return NotRetrievedCpuUsageValue
	}
	return r
}

func CurrentMemoryPercentUsage() float32 {
	r, ok := memoryPercentUsage.Load().(float32)
	if !ok {
		return NotRetrievedMemoryValue
	}
	return r
}

func CurrentMemoryUsage() float32 {
	r, ok := memoryUsagebytes.Load().(float32)
	if !ok {
		return NotRetrievedMemoryValue
	}
	return r
}

func initMemoryCollector(d time.Duration) {
	if d == 0 {
		return
	}
	// Initial memory retrieval.
	retrieveAndUpdateMemoryStat()

	go func() {
		memoryStatCollectorOnce.Do(func() {
			ticker := time.NewTicker(d)
			for {
				select {
				case <-ticker.C:
					retrieveAndUpdateMemoryStat()
				case <-ssStopChan:
					ticker.Stop()
					return
				}
			}
		})
	}()
}

func retrieveAndUpdateMemoryStat() {
	var (
		err           error
		memoryLimit   uint64
		memoryPercent float32
	)
	curProcess := currentProcess.Load()
	p := curProcess.(*process.Process)

	if isContainer {
		memoryLimit, err = GetContainerMemoryLimit()
		if err != nil {
			log.Println(err, "Fail to retrieve and update container memory statistic")
			return
		}
		// memoryInfo, err := p.MemoryInfo()
		// if err != nil {
		// 	log.Println(err, "Fail to retrieve and update container memory statistic")
		// 	return
		// }
		usage, err := readUint(memoryUsage)
		if err != nil {
			log.Println(err, "Fail to retrieve and update container memory statistic")
			return
		}
		// log.Println("mem usage:", usage)
		memoryUsagebytes.Store(float32(usage))
		memoryPercent = float32(usage) / float32(memoryLimit) * 100
	} else {
		memoryPercent, err = p.MemoryPercent()
		memoryPercent = memoryPercent * 100
		if err != nil {
			log.Println(err, "Fail to retrieve and update container memory statistic")
			return
		}
	}
	memoryPercentUsage.Store(memoryPercent)
}

func GetContainerMemoryLimit() (uint64, error) {
	usage, err := readUint(memoryPath)
	if err != nil {
		return 0, err
	}
	machineMemory, err := mem.VirtualMemoryWithContext(context.TODO())
	if err != nil {
		return 0, err
	}
	limit := uint64(math.Min(float64(usage), float64(machineMemory.Total)))
	return limit, nil
}
