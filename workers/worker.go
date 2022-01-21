package main

import (
	"dataplaneworkers/routes"
	"fmt"
	"log"
	"net"
	"os"
)

func main() {

	port := os.Getenv("dataplane_worker_port")
	if port == "" {
		port = "9005"
	}

	app := routes.Setup(port)

	name, err := os.Hostname()
	log.Println("Hostname: ", name)
	if err != nil {
		fmt.Printf("Oops: %v\n", err)
		return
	}

	addrs, err := net.LookupHost(name)
	if err != nil {
		fmt.Printf("Oops: %v\n", err)
		return
	}

	for _, a := range addrs {
		fmt.Println(a)
	}

	log.Fatal(app.Listen("0.0.0.0:" + port))
}
