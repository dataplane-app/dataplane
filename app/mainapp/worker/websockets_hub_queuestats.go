package worker

import (
	"dataplane/mainapp/logging"
	"log"
	"os"
	"time"

	"github.com/gofiber/websocket/v2"
)

type clientq struct{} // Add more data to this type if needed

var clientsq = make(map[*websocket.Conn]client) // Note: although large maps with pointer-like types (e.g. strings) as keys are slow, using pointers themselves as keys is acceptable and fast
var registerq = make(chan *websocket.Conn)
var broadcastq = make(chan []byte)
var unregisterq = make(chan *websocket.Conn)
var securetimeoutq = make(chan int)

func secureTimeoutq(connection *websocket.Conn) {
	time.Sleep(120 * time.Second)
	if _, ok := clientsq[connection]; ok {
		unregisterq <- connection
		cm := websocket.FormatCloseMessage(websocket.CloseTryAgainLater, "reconnect")
		if err := connection.WriteMessage(websocket.CloseMessage, cm); err != nil {
			// handle error
			log.Println(err)
		}
		if os.Getenv("messagedebug") == "true" {
			log.Println("connection unregistered by SecureTimeout")
		}
	}
}

func RunHubQueueStats() {
	for {
		select {
		case connection := <-registerq:
			clientsq[connection] = client{}
			go SecureTimeout(connection)
			// go func() { Securetimeout <- 0 }()
			if os.Getenv("messagedebug") == "true" {
				log.Println("connection registered")
			}

		case message := <-broadcastq:

			if os.Getenv("messagedebug") == "true" {
				logging.PrintSecretsRedact("message received:", string(message))
			}

			// Send the message to all clients
			for connection := range clientsq {

				if err := connection.WriteMessage(websocket.TextMessage, []byte(message)); err != nil {
					log.Println("write error:", err)

					connection.WriteMessage(websocket.CloseMessage, []byte{})
					connection.Close()
					delete(clientsq, connection)
				}
			}

		case connection := <-unregisterq:
			// Remove the client from the hub
			delete(clientsq, connection)
			if os.Getenv("messagedebug") == "true" {
				log.Println("connection unregistered")
			}
		}
	}
}
