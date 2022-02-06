package utilities

import "dataplane/mainapp/database/models"

// var i = [string]int
var i = make(map[string]int)

// var servers = []string{"127.0.0.1:8000", "127.0.0.1:8001", "127.0.0.1:8003"}

// Balance returns one of the servers based using round-robin algorithm
func Balance(workers []models.WorkerStats, workerGroup string) string {
	worker := workers[i[workerGroup]]
	i[workerGroup]++

	// it means that we reached the end of servers
	// and we need to reset the counter and start
	// from the beginning
	if i[workerGroup] >= len(workers) {
		i[workerGroup] = 0
	}

	// return the worker to send the task to
	return worker.WorkerID
}
