package worker

import (
	"dataplane/mainapp/logging"
	"log"
	"os"
	"time"

	"github.com/gofiber/websocket/v2"
)

type clientq struct{} // Add more data to this type if needed

var clientsq = make(map[string]map[*websocket.Conn]client) // Note: although large maps with pointer-like types (e.g. strings) as keys are slow, using pointers themselves as keys is acceptable and fast
var registerq = make(chan subscription)
var broadcastq = make(chan message)
var unregisterq = make(chan subscription)
var securetimeoutq = make(chan int)

type message struct {
	data []byte
	room string
}

type subscription struct {
	conn *websocket.Conn
	room string
}

func secureTimeoutq(room string, connection *websocket.Conn) {
	time.Sleep(120 * time.Second)
	if _, ok := clientsq[room][connection]; ok {
		unregisterq <- subscription{conn: connection, room: room}
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

func RunHubRooms() {
	for {
		select {
		case register := <-registerq:

			connections := clientsq[register.room]
			if connections == nil {
				connections = make(map[*websocket.Conn]client)
				clientsq[register.room] = connections
			}

			log.Println("connection struct:", register)

			clientsq[register.room][register.conn] = client{}

			log.Println("client map:", clientsq)

			go secureTimeoutq(register.room, register.conn)
			// go func() { Securetimeout <- 0 }()
			if os.Getenv("messagedebug") == "true" {
				log.Println("connection registered")
			}

		case message := <-broadcastq:

			if os.Getenv("messagedebug") == "true" {
				logging.PrintSecretsRedact("room:", message.room, "message received:", string(message.data))
			}

			// Send the message to all clients
			for connection := range clientsq[message.room] {

				if err := connection.WriteMessage(websocket.TextMessage, []byte(message.data)); err != nil {
					log.Println("write error:", err)

					connection.WriteMessage(websocket.CloseMessage, []byte{})
					connection.Close()
					delete(clientsq[message.room], connection)
					if len(clientsq[message.room]) == 0 {
						delete(clientsq, message.room)
					}
				}
			}

		case register := <-unregisterq:

			connections := clientsq[register.room]
			if connections != nil {
				if _, ok := connections[register.conn]; ok {
					delete(connections, register.conn)
					if len(connections) == 0 {
						delete(clientsq, register.room)
					}
				}
			}
			// Remove the client from the hub
			// delete(clientsq, connection)
			if os.Getenv("messagedebug") == "true" {
				log.Println("connection for room:" + register.room + " unregistered")
				log.Println("connections:", clientsq)
			}
		}
	}
}
