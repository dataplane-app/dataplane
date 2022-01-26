package worker

import (
	"dataplane/logging"
	"dataplane/messageq"
	"log"
	"os"

	"github.com/gofiber/websocket/v2"
	"github.com/nats-io/nats.go"
)

var Broadcast = make(chan []byte)

// https://github.com/marcelo-tm/testws/blob/master/main.go
func WorkerStatsWs(conn *websocket.Conn, subject string) {

	// var broadcast chan []byte
	sub, _ := messageq.NATSencoded.Subscribe(subject, func(m *nats.Msg) {
		if os.Getenv("messagedebug") == "true" {
			logging.PrintSecretsRedact(string(m.Data))
		}
		Broadcast <- m.Data

	})

	for {

		message := <-Broadcast
		if err := conn.WriteMessage(1, []byte(message)); err != nil {
			conn.WriteMessage(websocket.CloseMessage, []byte{})
			conn.Close()
			log.Println("write:", err)
			break
		}
	}

	// When the function returns, unregister the client and close the connection
	defer func() {
		// 	unregister <- conn
		conn.Close()
		messageq.NATSencoded.Flush()
		sub.Unsubscribe()
	}()

}
