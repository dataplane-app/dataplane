package remoteworker

import (
	"log"

	"github.com/gofiber/websocket/v2"
)

type WebsocketConn struct {
	*websocket.Conn
}

func (c *WebsocketConn) Read(p []byte) (int, error) {
	_, data, err := c.Conn.ReadMessage()
	log.Println(string(data))
	if err != nil {
		return 0, err
	}
	return copy(p, data), nil
}

func (c *WebsocketConn) Write(p []byte) (int, error) {
	err := c.Conn.WriteMessage(websocket.TextMessage, p)
	if err != nil {
		return 0, err
	}
	return len(p), nil
}

func (c *WebsocketConn) Close() error {
	return c.Conn.Close()
}
