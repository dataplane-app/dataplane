package messageq

import (
	"log"
	"os"
	"time"

	"github.com/dataplane-app/dataplane/app/mainapp/logging"

	"github.com/nats-io/nats.go"
)

var NATS *nats.Conn
var NATSencoded *nats.EncodedConn
var NATSProtobuf *nats.EncodedConn

func NATSConnect() {

	// const maxRetiresAllowed int = 50000
	var err error
	// for i := 0; i < maxRetiresAllowed; i++ {

	// NATS, err = nats.Connect()

	NATS, err := nats.Connect(os.Getenv("DP_NATS"),
		nats.RetryOnFailedConnect(true),
		nats.MaxReconnects(5000),
		nats.ReconnectWait(5*time.Second),
		nats.ReconnectHandler(func(_ *nats.Conn) {
			// Note that this will be invoked for the first asynchronous connect.
		}))
	if err != nil {
		// Should not return an error even if it can't connect, but you still
		// need to check in case there are some configuration errors.
		log.Printf("😩 NATS: connection failure: %v", err.Error())
	}

	var err2 error
	NATSencoded, err2 = nats.NewEncodedConn(NATS, nats.JSON_ENCODER)
	// defer NATSencoded.Close()
	if err2 != nil {
		logging.PrintSecretsRedact("encoded NATS:", err2.Error())
		log.Fatal("Failed to connect to encoded NATS")
	}

	// NATSProtobuf, _ = nats.NewEncodedConn(NATS, protobuf.PROTOBUF_ENCODER)
	// if err != nil {
	// 	logging.PrintSecretsRedact(err.Error())
	// 	log.Fatal("Failed to connect to encoded NATS")
	// }

	log.Println("📧 NATS connected")
	//DBConn.dpconfig.PrepareStmt = true
}
