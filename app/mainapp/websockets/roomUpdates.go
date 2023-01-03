package wsockets

import (
	"log"
	"strings"

	dpconfig "github.com/dataplane-app/dataplane/app/mainapp/config"
	"github.com/dataplane-app/dataplane/app/mainapp/utilities"

	"github.com/dataplane-app/dataplane/app/mainapp/messageq"
	"github.com/gofiber/websocket/v2"
	"github.com/nats-io/nats.go"
)

var quit = make(chan bool)

// https://github.com/gorilla/websocket/blob/master/examples/chat/client.go

// https://github.com/marcelo-tm/testws/blob/master/main.go

func RoomUpdates(conn *websocket.Conn, room string) {

	if strings.Contains(room, "*") {
		log.Println("Wildcards not allowed")
		return
	}

	// log.Println("Subject:", subject)

	/* Rooms:
	taskupdate.<envID>.<runID>
	codepackage.<envID>.<workergroup>
	workerlogs.<envID>.<runID>.<nodeID>
	coderunfilelogs.<envID>.<runID>
	workergroupstats.<envID>.<workergroup>
	*/

	/* To prevent subscribing to any NATS messaging - only specific to frontend */
	availableRooms := []string{
		"taskupdate.",
		"codepackage.",
		"workerlogs.",
		"coderunfilelogs.",
		"workergroupstats.",
		"remoteworkeronline."}

	if utilities.InArrayContains(room, availableRooms) {
		log.Println("subject not found")
		return
	}

	if dpconfig.MQDebug == "true" {
		log.Println("Real-time Room:", room)
	}

	sub, _ := messageq.NATSencoded.Subscribe(room, func(m *nats.Msg) {

		Broadcast <- Message{Room: room, Data: m.Data}

	})

	// When the function returns, unregister the client and close the connection
	defer func() {
		Unregister <- Subscription{Conn: conn, Room: room}
		sub.Unsubscribe()
		// Stop the broadcasting messages
		quit <- true
		conn.Close()
	}()

	// Register the client
	Register <- Subscription{Conn: conn, Room: room}

	// go SecureTimeout()

	for {

		mt, message, err := conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {

				if dpconfig.Debug == "true" {
					log.Println("read error:", err)
				}

			}
			return
		}

		if dpconfig.MQDebug == "true" {
			log.Println("message received from client:", mt, string(message))
		}
	}

}
