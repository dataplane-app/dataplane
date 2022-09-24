package messageq

import (
	"log"
	"os"
	"time"

	wrkerconfig "github.com/dataplane-app/dataplane/workers/config"

	"github.com/nats-io/nats.go"
)

var NATS *nats.Conn
var NATSencoded *nats.EncodedConn
var NATSProtobuf *nats.EncodedConn
var NATSStream nats.JetStreamContext

func NATSConnect() {

	const maxRetiresAllowed int = 50000
	var err error
	for i := 0; i < maxRetiresAllowed; i++ {

		NATS, err = nats.Connect(os.Getenv("DP_NATS"))

		if err == nil {
			break
		} else {
			log.Printf("😩 NATS: connection failure: %v, try number. %d, retry in 5 seconds", wrkerconfig.Secrets.Replace(err.Error()), i+1)
			time.Sleep(time.Second * 5)
		}
	}

	NATSencoded, _ = nats.NewEncodedConn(NATS, nats.JSON_ENCODER)
	if err != nil {
		log.Println(err.Error())
		log.Fatal("Failed to connect to encoded NATS")
	}

	// NATSProtobuf, _ = nats.NewEncodedConn(NATS, protobuf.PROTOBUF_ENCODER)
	// if err != nil {
	// 	logging.PrintSecretsRedact(err.Error())
	// 	log.Fatal("Failed to connect to encoded NATS")
	// }

	// Create JetStream Context
	// NATSStream, _ = NATS.JetStream(nats.PublishAsyncMaxPending(256))

	log.Println("📧 NATS connected")
	//DBConn.wrkerconfig.PrepareStmt = true
}
