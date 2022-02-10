package cmetric

import "time"

func SetMemoryRetrieveDuration(d time.Duration) {
	memoryRetrieveDuration = d
}

func SetCpuRetrieveDuration(d time.Duration) {
	cpuRetrieveDuration = d
}
