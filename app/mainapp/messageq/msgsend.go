package messageq

func MsgSend(channel string, msg interface{}) error {

	err := NATSencoded.Publish(channel, msg)
	return err

}
