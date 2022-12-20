package remoteworker

import (
	"encoding/json"
	"log"
	"net/rpc/jsonrpc"

	dpconfig "github.com/dataplane-app/dataplane/app/mainapp/config"
	"github.com/dataplane-app/dataplane/app/mainapp/database/models"

	"github.com/gofiber/websocket/v2"
)

var quit = make(chan bool)

type WebsocketConn struct {
	*websocket.Conn
}

func (c *WebsocketConn) Read(p []byte) (int, error) {
	_, data, err := c.Conn.ReadMessage()
	if err != nil {
		return 0, err
	}
	return copy(p, data), nil
}

func (c *WebsocketConn) Write(p []byte) (int, error) {
	err := c.Conn.WriteMessage(websocket.BinaryMessage, p)
	if err != nil {
		return 0, err
	}
	return len(p), nil
}

func (c *WebsocketConn) Close() error {
	return c.Conn.Close()
}

// https://github.com/gorilla/websocket/blob/master/examples/chat/client.go

// https://github.com/marcelo-tm/testws/blob/master/main.go

func WebsocketRoutes(conn *websocket.Conn) {

	c := jsonrpc.NewClient(&WebsocketConn{conn})
	args := []string{}
	var reply string
	errme := c.Call("meme", args, &reply)
	if errme != nil {
		log.Println(errme)
	}

	request := conn.Locals("request").(string)
	remoteWorkerID := conn.Locals("remoteWorkerID").(string)
	sessionID := conn.Locals("sessionID").(string)

	// When the function returns, unregister the client and close the connection
	defer func() {
		Unregister <- Subscription{Conn: conn, Room: remoteWorkerID + "=" + sessionID}
		// sub.Unsubscribe()
		// Stop the broadcasting messages
		// conn.Close()
		// quit <- true
	}()

	// Register the client
	Register <- Subscription{Conn: conn, Room: remoteWorkerID + "=" + sessionID}

	// go SecureTimeout()
	switch request {

	/* Connect: authenticate the worker */
	case "heartbeat":

	case "jsonrpc":

	case "test":

	default:
		/* Close the connection */
		log.Println("Remote worker websocket: method not found:", request, remoteWorkerID)

		response := models.RWMessage{
			Request:  request,
			Status:   "error",
			Response: "Method not found",
		}
		responseBytes, _ := json.Marshal(response)
		Broadcast <- Message{Room: remoteWorkerID + "=" + sessionID, Data: responseBytes}
		// Broadcast <- Message{Room: remoteWorkerID + "=" + sessionID, Data: []byte("Method not found.")}
		// Unregister <- Subscription{Conn: conn, Room: remoteWorkerID + "=" + sessionID}
		cm := websocket.FormatCloseMessage(websocket.CloseNormalClosure, "closed")
		if err := conn.WriteMessage(websocket.CloseMessage, cm); err != nil {
			// handle error
			log.Println("Error with write", err)
		}

	}

	/* ------- Receive messages ------ */
	for {

		mt, message, err := conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				// if dpconfig.RemoteWorkerDebug == "true" {
				log.Println("read error:", err)
				// }
			}
			return
		}

		if dpconfig.RemoteWorkerDebug == "true" {
			log.Println("message received from client:", mt, remoteWorkerID+"="+sessionID, string(message))
		}

		/* ----- Route the incoming requests ----- */
		switch request {

		case "jsonrpc":

			/* Read the JSON RPC incoming message */
			var request models.RPCRequest
			if err := json.Unmarshal(message, &request); err != nil {

				log.Println("jsonrpc request unmarshal:", err)
				rpcerror := models.RPCError{
					Code:    -32700,
					Message: "Request parse error",
					Data:    err.Error(),
				}
				responseBytes, _ := json.Marshal(rpcerror)
				Broadcast <- Message{Room: remoteWorkerID + "=" + sessionID, Data: responseBytes}

				break
			}

			log.Println("jsonrpc:", string(message), request)

			switch request.Method {

			/* ------- Heart beat of the worker every second ------- */
			case "heartbeat":

				err := RWHeartBeat(remoteWorkerID, sessionID)
				if err != nil {

					log.Println("jsonrpc heartbeat error:", err)
					rpcerror := models.RPCError{
						Code:    -32603,
						Message: "Heartbeat error",
						Data:    err.Error(),
					}
					responseBytes, _ := json.Marshal(rpcerror)
					Broadcast <- Message{Room: remoteWorkerID + "=" + sessionID, Data: responseBytes}

					break
				}

				response := models.RPCResponse{
					Version: "2.0",
					Result:  "OK",
					ID:      request.ID,
				}
				responseBytes, _ := json.Marshal(response)
				Broadcast <- Message{Room: remoteWorkerID + "=" + sessionID, Data: responseBytes}

			case "add":
			case "subtract":
			default:
				rpcerror := models.RPCError{
					Code:    -32601,
					Message: "Method not found",
				}
				responseBytes, _ := json.Marshal(rpcerror)
				Broadcast <- Message{Room: remoteWorkerID + "=" + sessionID, Data: responseBytes}
			}

		/* Connect: authenticate the worker */
		case "heartbeat":

			err := RWHeartBeat(remoteWorkerID, sessionID)
			if err != nil {

				response := models.RWMessage{
					Request:  request,
					Status:   "error",
					Response: err.Error(),
				}
				responseBytes, _ := json.Marshal(response)
				Broadcast <- Message{Room: remoteWorkerID + "=" + sessionID, Data: responseBytes}

				break
			}

			response := models.RWMessage{
				Request:  request,
				Status:   "OK",
				Response: "1",
			}
			responseBytes, _ := json.Marshal(response)
			Broadcast <- Message{Room: remoteWorkerID + "=" + sessionID, Data: responseBytes}
		}

	}

}
