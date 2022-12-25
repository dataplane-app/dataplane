package remoteworker

import (
	"log"

	dpconfig "github.com/dataplane-app/dataplane/app/mainapp/config"
	"github.com/gofiber/websocket/v2"
	cmap "github.com/orcaman/concurrent-map"
)

type client struct{} // Add more data to this type if needed

var Register = make(chan Subscription)
var Broadcast = make(chan Message)
var Unregister = make(chan Subscription)

type Message struct {
	Data     []byte
	WorkerID string
}

type Subscription struct {
	Conn     *websocket.Conn
	WorkerID string
}

/* The hub is only used to send messages to the correct worker from outside
e.g. trigger a websocket from scheduler. The hub keeps a list of workers and their websocket connection.
The normal connection e.g. heartbeat has a direct relationship that doesnt require the hub.
*/

func RPCHub() {

	// Rooms with list of clients
	WorkerIDClients := cmap.New()

	for {
		select {
		case connection := <-Register:

			/* Does this connection already exist? */

			WorkerIDClients.Set(connection.WorkerID, connection.Conn)

			// log.Println(connection.Conn)

			// Show clients belonging to which room
			// if dpconfig.MQDebug == "true" {
			log.Println("connections: " + connection.WorkerID + " registered.")
			// }

		case message := <-Broadcast:

			// log.Println("message received:", string(message.Data), message.Room)
			var client *websocket.Conn
			log.Println("Hub count:", WorkerIDClients.Count())

			// Send the message to all clients in the room provided
			if tmp, ok := WorkerIDClients.Get(message.WorkerID); ok {
				client = tmp.(*websocket.Conn)

				if err := client.WriteMessage(websocket.TextMessage, message.Data); err != nil {
					log.Println("write error:", err)

					client.WriteMessage(websocket.CloseMessage, []byte{})
					client.Close()
					// delete(clients, connection)
					WorkerIDClients.Remove(message.WorkerID)
				}
			}

		case connection := <-Unregister:
			// Remove the client from the hub

			if _, ok := WorkerIDClients.Get(connection.WorkerID); ok {

				WorkerIDClients.Remove(connection.WorkerID)
			}
			if dpconfig.MQDebug == "true" {
				log.Println("connection " + connection.WorkerID + " unregistered.")
			}
		}
	}
}
