package messageq

import (
	"github.com/nats-io/nats.go"
)

func SubscribeMsgReply(channel string, msg interface{}, resp interface{}) error {

	_, err := NATSencoded.Subscribe(channel, func(m *nats.Msg) {
		NATSencoded.Publish(m.Reply, resp)
	})

	return err

}
