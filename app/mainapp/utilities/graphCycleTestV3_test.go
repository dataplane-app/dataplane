package utilities

import (
	"log"
	"testing"
)

// go test -timeout 30s -v -run ^TestIsAcyclic github.com/dataplane-app/dataplane/app/mainapp/utilities

/*
Run performance test on graph cycle
go test -timeout 30s -v -run ^TestIsAcyclic_Positive$ github.com/dataplane-app/dataplane/app/mainapp/utilities
*/

func TestIsAcyclic_Positive(t *testing.T) {
	g := NewGraphV3()
	g.AddEdge("A", "B")
	g.AddEdge("B", "C")
	g.AddEdge("B", "D")
	g.AddEdge("B", "E")
	g.AddEdge("C", "O")
	g.AddEdge("D", "O")
	g.AddEdge("E", "O")
	g.AddEdge("O", "Z")

	acyclic := g.IsAcyclic()

	log.Println("Function response:", acyclic)

	if !acyclic {
		t.Errorf("Expected acyclic graph (true), but detected cycle (false)")
	}
}

/*
Run performance test on graph cycle
go test -timeout 30s -v -run ^TestIsAcyclic_Negative$ github.com/dataplane-app/dataplane/app/mainapp/utilities
*/

func TestIsAcyclic_Negative(t *testing.T) {
	g := NewGraphV3()
	g.AddEdge("A", "B")
	g.AddEdge("B", "C")
	g.AddEdge("B", "E")
	g.AddEdge("C", "O")
	g.AddEdge("D", "O")
	g.AddEdge("E", "O")
	g.AddEdge("O", "Z")
	g.AddEdge("C", "A") // Creating a cycle

	acyclic := g.IsAcyclic()

	log.Println("Function response:", acyclic)

	if acyclic {
		t.Errorf("Expected cyclic graph (false), but got acyclic (true)")
	}
}

/*
Run performance test on graph cycle
go test -timeout 30s -v -run ^TestIsAcyclic_SelfNegative$ github.com/dataplane-app/dataplane/app/mainapp/utilities
*/

func TestIsAcyclic_SelfNegative(t *testing.T) {
	g := NewGraphV3()
	g.AddEdge("A", "B")
	g.AddEdge("B", "C")
	g.AddEdge("C", "C") // Creating a cycle

	acyclic := g.IsAcyclic()

	log.Println("Function response:", acyclic)

	if acyclic {
		t.Errorf("Expected cyclic graph (false), but got acyclic (true)")
	}
}
