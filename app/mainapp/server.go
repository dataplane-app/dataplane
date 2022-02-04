package main

import (
	"dataplane/mainapp/routes"
	"log"
	"os"
)

func main() {

	port := os.Getenv("dataplane_port")
	if port == "" {
		port = "9000"
	}

	app := routes.Setup(port)

	log.Fatal(app.Listen("0.0.0.0:" + port))
}
