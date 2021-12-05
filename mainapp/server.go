package main

import (
	"dataplane/logging"
	"dataplane/routes"
	"log"
)

func main() {

	// Load secrets
	logging.MapSecrets()

	app := routes.Setup()

	log.Fatal(app.Listen("0.0.0.0:9000"))
}
