package main

import (
	"dataplane/routes"
	"log"
)

func main() {

	app := routes.Setup()

	log.Fatal(app.Listen("0.0.0.0:9000"))
}
