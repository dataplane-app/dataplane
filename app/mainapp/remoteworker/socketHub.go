package remoteworker

import (
	"log"
	"time"

	dpconfig "github.com/dataplane-app/dataplane/app/mainapp/config"
	"github.com/gofiber/websocket/v2"
	cmap "github.com/orcaman/concurrent-map"
)

type client struct{} // Add more data to this type if needed

var Register = make(chan Subscription)
var Broadcast = make(chan Message)
var Unregister = make(chan Subscription)

type Message struct {
	Data []byte
	Room string
}

type Subscription struct {
	Conn *websocket.Conn
	Room string
}

func secureTimeoutq(room string, connection *websocket.Conn, RoomswithClients cmap.ConcurrentMap) {
	time.Sleep(2 * 24 * time.Hour)
	// time.Sleep(10 * time.Second)

	// log.Println("retry")

	if tmp, ok := RoomswithClients.Get(room); ok {

		var clientsqconn = make(map[*websocket.Conn]client)

		clientsqconn = tmp.(map[*websocket.Conn]client)

		if _, ok := clientsqconn[connection]; ok {
			Unregister <- Subscription{Conn: connection, Room: room}
			cm := websocket.FormatCloseMessage(websocket.CloseTryAgainLater, "reconnect")
			if err := connection.WriteMessage(websocket.CloseMessage, cm); err != nil {
				// handle error
				log.Println("Error with write", err)
			}

			if dpconfig.MQDebug == "true" {
				log.Println("connection unregistered by SecureTimeout")
			}

		}
	}
}

func RemoteWorkerRunHub() {

	// Rooms with list of clients
	RoomswithClients := cmap.New()

	for {
		select {
		case connection := <-Register:

			var clients = make(map[*websocket.Conn]client) // Note: although large maps with pointer-like types (e.g. strings) as keys are slow, using pointers themselves as keys is acceptable and fast

			// Retrieve list of clients in the room.
			if tmp, ok := RoomswithClients.Get(connection.Room); ok {

				// Existing room add connection
				clients = tmp.(map[*websocket.Conn]client)
				clients[connection.Conn] = client{}

				RoomswithClients.Set(connection.Room, clients)
			} else {

				// New room add connection
				clients[connection.Conn] = client{}
				RoomswithClients.Set(connection.Room, clients)
			}

			/* The connect retry will be handled by the heartbeat in the client */
			go secureTimeoutq(connection.Room, connection.Conn, RoomswithClients)

			// Show clients belonging to which room
			if dpconfig.RemoteWorkerDebug == "true" {
				log.Println("connections registered:")
			}

			// if tmp, ok := RoomswithClients.Get(connection.Room); ok {
			// 	clientsperRoom = tmp.([]*websocket.Conn)
			// }
			// for i, rooms := range RoomswithClients {
			// 	log.Println("Reg: ", i, rooms)
			// }

		case message := <-Broadcast:

			// log.Println("message received:", string(message.Data), message.Room)
			var clients = make(map[*websocket.Conn]client)

			// Send the message to all clients in the room provided
			if tmp, ok := RoomswithClients.Get(message.Room); ok {
				clients = tmp.(map[*websocket.Conn]client)

				for connection := range clients {

					// If an error occurs close the client

					if err := connection.WriteMessage(websocket.TextMessage, []byte(message.Data)); err != nil {
						log.Println("write error:", err)

						connection.WriteMessage(websocket.CloseMessage, []byte{})
						connection.Close()
						delete(clients, connection)
						RoomswithClients.Set(message.Room, clients)
					}
				}
			}

		case connection := <-Unregister:
			// Remove the client from the hub

			if tmp, ok := RoomswithClients.Get(connection.Room); ok {
				var clients = make(map[*websocket.Conn]client)
				clients = tmp.(map[*websocket.Conn]client)
				delete(clients, connection.Conn)
				RoomswithClients.Set(connection.Room, clients)
			}
			if dpconfig.MQDebug == "true" {
				log.Println("connection unregistered")
			}
		}
	}
}
