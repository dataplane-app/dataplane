package utilities

import (
	"fmt"
	"testing"
	"time"
)

/*
Run performance test on graph cycle
go test -timeout 30s -v -run ^TestGraphCycleSpeedV3$ github.com/dataplane-app/dataplane/app/mainapp/utilities
*/
func TestGraphCycleSpeedV3(t *testing.T) {

	g := NewGraphV3()

	// Create 1,000 nodes with random edges to ensure an acyclic graph
	startTime := time.Now()
	for i := 0; i < 100000; i++ {
		nodeA := fmt.Sprintf("Node%d", i)

		// rand.Intn(i+1)
		nodeB := fmt.Sprintf("Node%d", i+1)
		g.AddEdge(nodeA, nodeB)
	}
	elapsedTime := time.Since(startTime)

	fmt.Printf("Elapsed creation time: %d ms\n", elapsedTime.Milliseconds())

	startTime = time.Now()
	isACyclic := g.IsAcyclic()
	elapsedTime = time.Since(startTime)

	if !isACyclic {
		fmt.Println("The graph contains a cycle.")
	} else {
		fmt.Println("The graph is acyclic.")
	}

	fmt.Printf("Elapsed cyctime: %d ms\n", elapsedTime.Milliseconds())
}
