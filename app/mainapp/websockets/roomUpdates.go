package wsockets

import (
	"log"
	"strings"

	dpconfig "github.com/dataplane-app/dataplane/app/mainapp/config"

	"github.com/dataplane-app/dataplane/app/mainapp/messageq"
	"github.com/gofiber/websocket/v2"
	"github.com/nats-io/nats.go"
)

var quit = make(chan bool)

// https://github.com/gorilla/websocket/blob/master/examples/chat/client.go

// https://github.com/marcelo-tm/testws/blob/master/main.go

func RoomUpdates(conn *websocket.Conn, environmentID string, subject string, id string) {

	room := ""
	subjectmsg := ""

	if environmentID == "*" {
		log.Println("Environment wildcard not allowed")
		return
	}

	switch subject {
	case "taskupdate." + environmentID + "." + id:
		// fmt.Println("one")
		room = "pipeline-run-updates." + environmentID + "." + id
		subjectmsg = "taskupdate." + environmentID + "." + id

	case "codepackage." + environmentID + "." + id:
		// fmt.Println("one")
		room = "code-package-install." + environmentID + "." + id
		subjectmsg = "codepackage." + environmentID + "." + id

	case "workerlogs." + id:
		room = "worker-logs." + id
		subjectmsg = "workerlogs." + id

		if strings.Contains(id, "*") {
			log.Println("Wildcards not allowed")
			return
		}

	case "coderunfilelogs." + id:
		room = "coderunfilelogs." + id
		subjectmsg = "coderunfilelogs." + id

		if strings.Contains(id, "*") {
			log.Println("Wildcards not allowed")
			return
		}

	case "workerlogs." + id:
		room = "worker-logs." + id
		subjectmsg = "workerlogs." + id

		if strings.Contains(id, "*") {
			log.Println("Wildcards not allowed")
			return
		}

	case "workergroupstats." + id:
		room = "worker-group-stats." + id
		subjectmsg = "workergroupstats." + id

		if strings.Contains(id, "*") {
			log.Println("Wildcards not allowed")
			return
		}

	default:
		log.Println("subject not found")
		return
	}

	log.Println("Room", room)

	sub, _ := messageq.NATSencoded.Subscribe(subjectmsg, func(m *nats.Msg) {

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
