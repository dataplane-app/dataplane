package remoteworker

import (
	"encoding/json"
	"errors"
	"log"

	dpconfig "github.com/dataplane-app/dataplane/app/mainapp/config"
	"github.com/dataplane-app/dataplane/app/mainapp/database/models"
	"github.com/gofiber/websocket/v2"
)

func RPCServer(conn *websocket.Conn) {

	remoteWorkerID := conn.Locals("remoteWorkerID").(string)
	sessionID := conn.Locals("sessionID").(string)

	/* ------- Register the Hub ------*/
	defer func() {
		Unregister <- Subscription{Conn: conn, WorkerID: remoteWorkerID}
	}()

	// Register the client
	Register <- Subscription{Conn: conn, WorkerID: remoteWorkerID}

	/* ------- Receive messages ------ */
	for {

		mt, message, err := conn.ReadMessage()
		log.Println(string(message))

		// log.Println("debug websocket:", string(message))
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

		/* Read the JSON RPC incoming message */
		var request models.RPCRequest
		if err := json.Unmarshal(message, &request); err != nil {

			RPCError(conn, request.ID, -32700, "Request parse error", err)

			break
		}

		// log.Println("jsonrpc:", string(message), request)

		/* ------- RPC Methods / Functions ------- */
		switch request.Method {

		case "":
			/* Empty method means this is a response and should be ignored, otherwise bi directional goes into an infinite loop */

		/* ------- Heart beat of the worker every second ------- */
		case "heartbeat":

			response, err := RWHeartBeat(conn, request.ID, remoteWorkerID, sessionID)
			if err != nil {
				RPCError(conn, request.ID, -32603, "Heartbeat error", err)
				break
			}
			RPCResponse(conn, request.ID, response)

		case "Arith.Multiply":

			log.Println("Params:", string(request.Params))
			response, err := Multiply(conn, request.ID, request.Params)
			if err != nil {
				RPCError(conn, request.ID, -32603, "Multiply error", err)
				break
			}
			RPCResponse(conn, request.ID, response)

		default:

			/* for bi directional activity: empty case above prevents infinite loop */
			RPCError(conn, request.ID, -32601, "Method not found", errors.New("Method not found"))

		}

	}
}
