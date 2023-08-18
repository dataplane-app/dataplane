package mqworker

import (
	"time"

	"github.com/dataplane-app/dataplane/app/mainapp/messageq"
)

func MsgReply(channel string, msg interface{}, response interface{}) (interface{}, error) {

	err := messageq.NATSencoded.Request(channel, msg, &response, time.Second)
	if err != nil {

	}
	// if wrkerconfig.MQDebug == "true" {
	// 	log.Println("response:", response)
	// }
	return response, err

}
