package main

import (
	"dataplane/workers/routes"
	"log"
	"os"
)

func main() {

	port := os.Getenv("dataplane_worker_port")
	if port == "" {
		port = "9005"
	}

	// for i := 1; i < 20; i++ {
	// 	cpu := cmetric.CurrentCpuUsage()
	// 	fmt.Println("cpu ", cpu)
	// 	memory := cmetric.CurrentMemoryUsage()
	// 	fmt.Println("memory ", memory)
	// 	time.Sleep(2000 * time.Millisecond)
	// }

	app := routes.Setup(port)

	log.Fatal(app.Listen("0.0.0.0:" + port))
}
