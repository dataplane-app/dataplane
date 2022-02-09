package worker

import (
	"dataplane/mainapp/logging"
	"log"
	"os"

	"github.com/gofiber/websocket/v2"
)

var Broadcast1 = make(chan []byte)

type MsgResult1 struct {
	Message []byte
	Err     error
}

var messagereceive1 = make(chan MsgResult)
var disconnectConn1 = make(chan string)

// https://github.com/gorilla/websocket/blob/master/examples/chat/client.go

// https://github.com/marcelo-tm/testws/blob/master/main.go
func TaskUpdatesWs(conn *websocket.Conn, subject string) {

	// Subscribe to a specific worker group when the connection is open
	// sub, _ := messageq.NATSencoded.Subscribe(subject, func(m *nats.Msg) {

	// 	broadcastq <- m.Data

	// })

	// When the function returns, unregister the client and close the connection
	defer func() {
		unregisterq <- conn
		conn.Close()
		// sub.Unsubscribe()
	}()

	// Register the client
	registerq <- conn

	// go SecureTimeout()

	for {

		mt, message, err := conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Println("read error:", err)
			}
			return
		}

		if os.Getenv("messagedebug") == "true" {
			logging.PrintSecretsRedact("message received from client:", mt, string(message))
		}

	}

}
