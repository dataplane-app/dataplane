package worker

import (
	"dataplane/logging"
	"log"
	"os"

	"github.com/gofiber/websocket/v2"
)

type client struct{} // Add more data to this type if needed

var clients = make(map[*websocket.Conn]client) // Note: although large maps with pointer-like types (e.g. strings) as keys are slow, using pointers themselves as keys is acceptable and fast
var register = make(chan *websocket.Conn)
var broadcast = make(chan []byte)
var unregister = make(chan *websocket.Conn)

func RunHub() {
	for {
		select {
		case connection := <-register:
			clients[connection] = client{}
			if os.Getenv("messagedebug") == "true" {
				log.Println("connection registered")
			}

		case message := <-broadcast:

			if os.Getenv("messagedebug") == "true" {
				logging.PrintSecretsRedact("message received:", string(message))
			}

			// Send the message to all clients
			for connection := range clients {
				if err := connection.WriteMessage(websocket.TextMessage, []byte(message)); err != nil {
					log.Println("write error:", err)

					connection.WriteMessage(websocket.CloseMessage, []byte{})
					connection.Close()
					delete(clients, connection)
				}
			}
		// case <-time.After(2 * time.Second):

		// 	log.Println("2 seconds")

		case connection := <-unregister:
			// Remove the client from the hub
			delete(clients, connection)
			if os.Getenv("messagedebug") == "true" {
				log.Println("connection unregistered")
			}
		}
	}
}
