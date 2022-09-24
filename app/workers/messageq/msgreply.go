package messageq

import (
	"time"
)

func MsgReply(channel string, msg interface{}, response interface{}) (interface{}, error) {

	err := NATSencoded.Request(channel, msg, &response, time.Second)
	if err != nil {

	}
	// if wrkerconfig.MQDebug == "true" {
	// 	log.Println("response:", response)
	// }
	return response, err

}
