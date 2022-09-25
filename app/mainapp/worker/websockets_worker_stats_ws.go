package worker

import (
	"log"

	dpconfig "github.com/dataplane-app/dataplane/app/mainapp/config"

	"github.com/dataplane-app/dataplane/app/mainapp/logging"
	"github.com/dataplane-app/dataplane/app/mainapp/messageq"

	"github.com/gofiber/websocket/v2"
	"github.com/nats-io/nats.go"
)

// var Broadcast = make(chan []byte)

type MsgResult struct {
	Message []byte
	Err     error
}

var messagereceive = make(chan MsgResult)
var disconnectConn = make(chan string)

// https://github.com/gorilla/websocket/blob/master/examples/chat/client.go

// https://github.com/marcelo-tm/testws/blob/master/main.go
func WorkerStatsWs(conn *websocket.Conn, subject string) {

	// Subscribe to a specific worker group when the connection is open
	sub, _ := messageq.NATSencoded.Subscribe(subject, func(m *nats.Msg) {

		broadcast <- m.Data

	})

	// When the function returns, unregister the client and close the connection
	defer func() {
		unregister <- conn
		conn.Close()
		sub.Unsubscribe()
	}()

	// Register the client
	register <- conn

	// go SecureTimeout()

	for {

		mt, message, err := conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Println("read error:", err)
			}
			return
		}

		if dpconfig.MQDebug == "true" {
			logging.PrintSecretsRedact("message received from client:", mt, string(message))
		}

	}

}
