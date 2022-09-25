package utilities

import (
	"log"
	"testing"

	"github.com/dataplane-app/dataplane/app/mainapp/database/models"

	"github.com/stretchr/testify/assert"
)

/*
Run Super secret squirrel function test
go test -timeout 30s -v -run ^TestGraphCycleCheckFunction$ github.com/dataplane-app/dataplane/app/mainapp/utilities
*/

// node1 > [node2, node3, node4] > node5 > node6
var TestNodes = []*models.PipelineNodes{
	{NodeID: "node1"},
	{NodeID: "node2"},
	{NodeID: "node3"},
	{NodeID: "node4"},
	{NodeID: "node5"},
	{NodeID: "node6"},
}

var TestEdges = []*models.PipelineEdges{
	{From: "node1", To: "node2"},
	{From: "node1", To: "node3"},
	{From: "node1", To: "node4"},
	{From: "node2", To: "node5"},
	{From: "node3", To: "node5"},
	{From: "node4", To: "node5"},
	{From: "node5", To: "node6"},
}

var TestEdgesCycle = []*models.PipelineEdges{
	{From: "node1", To: "node2"},
	{From: "node1", To: "node3"},
	{From: "node1", To: "node4"},
	{From: "node2", To: "node5"},
	{From: "node3", To: "node5"},
	{From: "node4", To: "node5"},
	{From: "node5", To: "node6"},
	{From: "node6", To: "node6"},
}

func TestGraphCycleCheckFunction(t *testing.T) {

	// Positive Test
	for _, s := range TestNodes {
		outcome := GraphCycleCheck(TestEdges, s.NodeID)
		log.Println("Cycle check:", outcome)
		assert.Equalf(t, false, outcome, "Cycle check")
	}

	// Negative Test
	for _, s := range TestNodes {
		outcome := GraphCycleCheck(TestEdgesCycle, s.NodeID)
		log.Println("Cycle check:", outcome)
		assert.Equalf(t, true, outcome, "Cycle check")
	}

}
