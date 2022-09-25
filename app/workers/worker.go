package main

import (
	"log"
	"os"

	"github.com/dataplane-app/dataplane/app/workers/routes"
)

func main() {

	port := os.Getenv("DP_WORKER_PORT")
	if port == "" {
		port = "9005"
	}

	app := routes.Setup(port)

	log.Fatal(app.Listen("0.0.0.0:" + port))
}
