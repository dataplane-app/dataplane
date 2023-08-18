package mqworker

import "github.com/dataplane-app/dataplane/app/mainapp/messageq"

func MsgSend(channel string, msg interface{}) error {

	err := messageq.NATSencoded.Publish(channel, msg)
	return err

}
