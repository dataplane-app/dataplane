package messageq

import (
	"log"
	"os"
	"time"

	"github.com/dataplane-app/dataplane/app/mainapp/logging"

	"github.com/nats-io/nats.go"
	"github.com/nats-io/nats.go/encoders/protobuf"
)

var NATS *nats.Conn
var NATSencoded *nats.EncodedConn
var NATSProtobuf *nats.EncodedConn

func NATSConnect() {

	const maxRetiresAllowed int = 50000
	var err error
	for i := 0; i < maxRetiresAllowed; i++ {

		NATS, err = nats.Connect(os.Getenv("DP_NATS"))

		if err == nil {
			break
		} else {
			log.Printf("😩 NATS: connection failure: %v, try number. %d, retry in 5 seconds", err.Error(), i+1)
			time.Sleep(time.Second * 5)
		}
	}

	// log.Println(NATS)

	if err != nil {
		logging.PrintSecretsRedact(err.Error())
		log.Fatal("Failed to connect to NATS")
	}

	NATSencoded, _ = nats.NewEncodedConn(NATS, nats.JSON_ENCODER)
	if err != nil {
		logging.PrintSecretsRedact(err.Error())
		log.Fatal("Failed to connect to encoded NATS")
	}

	NATSProtobuf, _ = nats.NewEncodedConn(NATS, protobuf.PROTOBUF_ENCODER)
	if err != nil {
		logging.PrintSecretsRedact(err.Error())
		log.Fatal("Failed to connect to encoded NATS")
	}

	log.Println("📧 NATS connected")
	//DBConn.dpconfig.PrepareStmt = true
}
