package utilities

// var i = [string]int
var i = make(map[string]int)

// var servers = []string{"127.0.0.1:8000", "127.0.0.1:8001", "127.0.0.1:8003"}

// Balance returns one of the servers based using round-robin algorithm
func Balance(servers []string, workerGroup string) string {
	server := servers[i[workerGroup]]
	i[workerGroup]++

	// it means that we reached the end of servers
	// and we need to reset the counter and start
	// from the beginning
	if i[workerGroup] >= len(servers) {
		i[workerGroup] = 0
	}
	return server
}
