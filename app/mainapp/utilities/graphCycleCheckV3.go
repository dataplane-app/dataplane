package utilities

type GraphV3 struct {
	nodes map[string][]string // Adjacency list representation
}

func NewGraphV3() *GraphV3 {
	return &GraphV3{

		// From one node to multiple nodes
		nodes: make(map[string][]string),
	}
}

func (g *GraphV3) AddEdge(src string, dest string) {
	g.nodes[src] = append(g.nodes[src], dest)
}

func (g *GraphV3) isCyclicDFS(node string, visited map[string]bool, recStack map[string]bool) bool {
	visited[node] = true
	recStack[node] = true

	// For every destination
	for _, destination := range g.nodes[node] {

		// log.Println("src: ", node, "dest: ", destination, "visited:", visited[destination])

		if !visited[destination] {
			if g.isCyclicDFS(destination, visited, recStack) {
				return true
			}
		} else if recStack[destination] {
			return true // Cycle detected
		}
	}

	recStack[node] = false // Remove the current node from the recursion stack
	return false
}

func (g *GraphV3) IsAcyclic() bool {
	visited := make(map[string]bool)
	recStack := make(map[string]bool)

	// Loop through all src nodes
	for node := range g.nodes {
		if !visited[node] {
			if g.isCyclicDFS(node, visited, recStack) {
				return false // Cycle detected, not acyclic
			}
		}
	}

	return true // No cycles found, acyclic
}
