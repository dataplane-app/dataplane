package utilities

import (
	"fmt"
	"log"
	"testing"

	"github.com/dataplane-app/dataplane/mainapp/database/models"

	"github.com/stretchr/testify/assert"
)

/*
go test -timeout 30s -v -run ^TestRoundRobin$ github.com/dataplane-app/dataplane/mainapp/utilities
*/
func TestRoundRobin(t *testing.T) {

	log.Println("========== Worker 1 =============")

	x := 0
	var servers = []models.WorkerStats{
		{WorkerID: "127.0.0.1:8000"},
		{WorkerID: "127.0.0.1:8001"},
		{WorkerID: "127.0.0.1:8003"},
	}
	workerGroup := "worker1"
	for i := 0; i < 20; i++ {

		next := Balance(servers, workerGroup)
		fmt.Println(x, next, servers[x].WorkerID)

		assert.Equalf(t, next, servers[x].WorkerID, "round robin lb")

		x++
		if x >= len(servers) {
			x = 0
		}
	}

	log.Println("========== Worker 2 =============")
	x = 0
	workerGroup = "worker2"
	for i := 0; i < 20; i++ {

		next := Balance(servers, workerGroup)
		fmt.Println(x, next, servers[x].WorkerID)

		assert.Equalf(t, next, servers[x].WorkerID, "round robin lb")

		x++
		if x >= len(servers) {
			x = 0
		}
	}
}
