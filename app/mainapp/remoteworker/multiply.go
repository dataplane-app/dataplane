package remoteworker

import (
	"encoding/json"
	"errors"
	"log"

	"github.com/gofiber/websocket/v2"
)

type Args struct {
	A int `json:a`
	B int `json:b`
}

/* Example body of websocket
{"jsonrpc": "2.0", "method": "Arith.Multiply", "params": {"a":4, "b":2}, "id": 1}
*/

func Multiply(conn *websocket.Conn, requestID string, params json.RawMessage) (int, error) {
	log.Println("Ran multiply function")
	var args Args
	err := json.Unmarshal(params, &args)
	if err != nil {
		return 0, errors.New("Multiply unmarshal input error")
	}
	return args.A * args.B, nil

}
