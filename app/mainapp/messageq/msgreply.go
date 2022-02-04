package messageq

import "time"

func MsgReply(channel string, msg interface{}) (interface{}, error) {

	var response interface{}
	err := NATSProtobuf.Request(channel, msg, response, time.Second)
	return response, err

}
