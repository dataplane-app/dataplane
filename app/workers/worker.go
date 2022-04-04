package main

import (
	"dataplane/workers/routes"
	"log"
	"os"
)

func main() {

	port := os.Getenv("DP_WORKER_PORT")
	if port == "" {
		port = "9005"
	}

	app := routes.Setup(port)

	log.Fatal(app.Listen("0.0.0.0:" + port))
}
