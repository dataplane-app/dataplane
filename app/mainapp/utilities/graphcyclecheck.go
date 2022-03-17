package utilities

import (
	"dataplane/mainapp/config"
	"dataplane/mainapp/database/models"
	"fmt"
	"log"
	"strings"
)

func GraphCycleCheck(edges []*models.PipelineEdges, node string) bool {

	graph := NewGraph()

	// // Add edges.
	for _, s := range edges {
		// log.Println("Edge: ", s.From, " -> ", s.To)
		graph.AddEdge(s.From, s.To)
	}

	// log.Println(graph)

	// Topologically sort nodes.
	_, err := graph.TopSort(node)
	if err != nil {
		if config.Debug == "true" {
			log.Println(err)
		}
		return true
	}

	return false
}

type Graph struct {
	nodes map[string]node
}

func NewGraph() *Graph {
	return &Graph{
		// Doesnt require concurrency safety, should be written / read in sequence.
		nodes: make(map[string]node),
	}
}

func (g *Graph) AddNode(name string) {
	if !g.ContainsNode(name) {
		g.nodes[name] = make(node)
	}
}

func (g *Graph) GetOrAddNode(name string) node {
	n, ok := g.nodes[name]
	if !ok {
		n = make(node)
		g.nodes[name] = n
	}
	return n
}

func (g *Graph) AddEdge(from string, to string) error {
	f := g.GetOrAddNode(from)
	g.AddNode(to)
	f.addEdge(to)
	return nil
}

func (g *Graph) ContainsNode(name string) bool {
	_, ok := g.nodes[name]
	return ok
}

func (g *Graph) TopSort(name string) ([]string, error) {
	results := newOrderedSet()
	err := g.visit(name, results, nil)
	if err != nil {
		return nil, err
	}
	return results.items, nil
}

func (g *Graph) visit(name string, results *orderedset, visited *orderedset) error {
	if visited == nil {
		visited = newOrderedSet()
	}

	added := visited.add(name)
	if !added {
		index := visited.index(name)
		cycle := append(visited.items[index:], name)
		return fmt.Errorf("Cycle error: %s", strings.Join(cycle, " -> "))
	}

	n := g.nodes[name]
	for _, edge := range n.edges() {
		err := g.visit(edge, results, visited.copy())
		if err != nil {
			return err
		}
	}

	results.add(name)
	return nil
}

type node map[string]bool

func (n node) addEdge(name string) {
	n[name] = true
}

func (n node) edges() []string {
	var keys []string
	for k := range n {
		keys = append(keys, k)
	}
	return keys
}

type orderedset struct {
	indexes map[string]int
	items   []string
	length  int
}

func newOrderedSet() *orderedset {
	return &orderedset{
		// Doesnt require concurrency safety, should be written / read in sequence.
		indexes: make(map[string]int),
		length:  0,
	}
}

func (s *orderedset) add(item string) bool {
	_, ok := s.indexes[item]
	if !ok {
		s.indexes[item] = s.length
		s.items = append(s.items, item)
		s.length++
	}
	return !ok
}

func (s *orderedset) copy() *orderedset {
	clone := newOrderedSet()
	for _, item := range s.items {
		clone.add(item)
	}
	return clone
}

func (s *orderedset) index(item string) int {
	index, ok := s.indexes[item]
	if ok {
		return index
	}
	return -1
}
