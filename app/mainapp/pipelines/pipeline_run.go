package main

import (
	"fmt"
	"log"
	"strings"
)

// Cycle:
// node1 > [node2, node3, node4] > node5 > node6 > node1

func main() {
	fmt.Println("GoLang, Graph DFS and BFS implementation")
	fmt.Println("DFS : Depth First Search")
	fmt.Println("BFS : Breadth First Search")

	g := NewGraph()

	g.AddVertex("node1")
	g.AddVertex("node2")
	g.AddVertex("node3")
	g.AddVertex("node4")
	g.AddVertex("node5")
	g.AddVertex("node6")

	g.AddEdge("node1", "node2")
	g.AddEdge("node1", "node3")
	g.AddEdge("node1", "node4")
	g.AddEdge("node2", "node5")
	g.AddEdge("node3", "node5")
	g.AddEdge("node4", "node5")
	g.AddEdge("node5", "node6")
	g.AddEdge("node6", "node1")

	// g.BFS("node1")
	// g.createVisited()
	g.DFS("node1")
	log.Println(g)
}

func NewGraph() Graph {
	return Graph{
		adjacency: make(map[string][]string),
	}
}

type Graph struct {
	adjacency map[string][]string
}

func (g *Graph) AddVertex(vertex string) bool {
	if _, ok := g.adjacency[vertex]; ok {
		fmt.Printf("vertex %v already exists\n", vertex)
		return false
	}
	g.adjacency[vertex] = []string{}
	return true
}

func (g *Graph) AddEdge(vertex, node string) bool {
	if _, ok := g.adjacency[vertex]; !ok {
		fmt.Printf("vertex %v does not exists\n", vertex)
		return false
	}
	if ok := contains(g.adjacency[vertex], node); ok {
		fmt.Printf("node %v already exists\n", node)
		return false
	}

	g.adjacency[vertex] = append(g.adjacency[vertex], node)
	return true
}

func (g Graph) BFS(startingNode string) {
	visited := g.createVisited()
	var q []string

	visited[startingNode] = true
	q = append(q, startingNode)

	for len(q) > 0 {
		var current string
		current, q = q[0], q[1:]
		fmt.Println("BFS", current)
		for _, node := range g.adjacency[current] {
			if !visited[node] {
				q = append(q, node)
				visited[node] = true
			}
		}
	}
	fmt.Println("Visited:", visited)
}

func (g Graph) DFS(startingNode string) {
	visited := g.createVisited()
	g.dfsRecursive(startingNode, visited)
}

func (g Graph) dfsRecursive(startingNode string, visited map[string]bool) {
	visited[startingNode] = true
	fmt.Println("DFS", startingNode)
	// log.Println("Start:", startingNode, g.adjacency[startingNode])
	for _, node := range g.adjacency[startingNode] {
		// log.Println(id, node)
		// log.Println("Show:", startingNode, "->", node)
		if !visited[node] {
			g.dfsRecursive(node, visited)
		} else {
			// log.Println("Show:", node, startingNode)
		}
	}
}

func (g Graph) CreatePath(firstNode, secondNode string) bool {
	visited := g.createVisited()
	var (
		path []string
		q    []string
	)
	q = append(q, firstNode)
	visited[firstNode] = true

	for len(q) > 0 {
		var currentNode string
		currentNode, q = q[0], q[1:]
		path = append(path, currentNode)
		edges := g.adjacency[currentNode]
		if contains(edges, secondNode) {
			path = append(path, secondNode)
			fmt.Println(strings.Join(path, "->"))
			return true
		}

		for _, node := range g.adjacency[currentNode] {
			if !visited[node] {
				visited[node] = true
				q = append(q, node)
			}
		}
	}
	fmt.Println("no link found")
	return false
}

func (g Graph) createVisited() map[string]bool {
	visited := make(map[string]bool, len(g.adjacency))
	for key := range g.adjacency {
		visited[key] = false
	}
	return visited
}

func contains(slice []string, item string) bool {
	set := make(map[string]struct{}, len(slice))
	for _, s := range slice {
		set[s] = struct{}{}
	}

	_, ok := set[item]
	return ok
}
