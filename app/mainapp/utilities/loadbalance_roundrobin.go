package utilities

import (
	"dataplane/mainapp/database/models"

	cmap "github.com/orcaman/concurrent-map"
)

// var i = [string]int
// var i = make(map[string]int)
// moved from map for concurrent use
var i = cmap.New()

// var servers = []string{"127.0.0.1:8000", "127.0.0.1:8001", "127.0.0.1:8003"}

// Balance returns one of the servers based using round-robin algorithm
func Balance(workers []models.WorkerStats, workerGroup string) string {

	// Retrieve current count from map.
	var worker models.WorkerStats
	var count int
	if tmp, ok := i.Get(workerGroup); ok {
		count = tmp.(int)
	}

	// worker := workers[i[workerGroup]]
	// Timing check
	if count >= len(workers) {
		worker = workers[0]
	} else {
		worker = workers[count]
	}
	count++
	// i[workerGroup]++

	i.Set(workerGroup, count)

	// it means that we reached the end of servers
	// and we need to reset the counter and start
	// from the beginning
	if count >= len(workers) {
		// i[workerGroup] = 0
		i.Set(workerGroup, 0)
	}

	// return the worker to send the task to
	return worker.WorkerID
}
