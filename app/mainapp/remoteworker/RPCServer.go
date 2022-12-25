package remoteworker

import (
	"context"
	"encoding/json"
	"errors"
	"log"

	dpconfig "github.com/dataplane-app/dataplane/app/mainapp/config"
	"github.com/dataplane-app/dataplane/app/mainapp/database"
	"github.com/dataplane-app/dataplane/app/mainapp/database/models"
	"github.com/gofiber/websocket/v2"
	jsoniter "github.com/json-iterator/go"
)

func RPCServer(conn *websocket.Conn, remoteWorkerID string) {

	/* ----- Check if remote worker aleady using this ID is checked on http auth ---- */
	ctx := context.Background()

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

		// ----- Authenticate all incoming messages --------
		sessionID := jsoniter.Get(message, "params", "Auth").ToString()
		log.Println("session token:", sessionID)

		// 2. Check session against redis
		val, err := database.RedisConn.Get(ctx, "sess-"+remoteWorkerID).Result()
		if err != nil {
			log.Println("Remote worker redis get connect error:", err)
			Unregister <- Subscription{Conn: conn, WorkerID: remoteWorkerID}
			conn.WriteMessage(websocket.CloseMessage, []byte{})
			conn.Close()
		}

		// log.Println(val, sessionID)

		if val != sessionID {
			log.Println("Remote worker session mismatch:")
			Unregister <- Subscription{Conn: conn, WorkerID: remoteWorkerID}
			conn.WriteMessage(websocket.CloseMessage, []byte{})
			conn.Close()
		}

		if dpconfig.RemoteWorkerDebug == "true" {
			log.Println("message received from client:", mt, remoteWorkerID, string(message))
		}

		/* ----- Route the incoming requests ----- */

		/* Read the JSON RPC incoming message */
		var request models.RPCRequest
		if err := json.Unmarshal(message, &request); err != nil {

			RPCError(remoteWorkerID, request.ID, -32700, "Request parse error", err)

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
				RPCError(remoteWorkerID, request.ID, -32603, "Heartbeat error", err)
				break
			}
			RPCResponse(remoteWorkerID, request.ID, response)

		case "Arith.Multiply":

			log.Println("Params:", string(request.Params))
			response, err := Multiply(conn, request.ID, request.Params)
			if err != nil {
				RPCError(remoteWorkerID, request.ID, -32603, "Multiply error", err)
				break
			}
			RPCResponse(remoteWorkerID, request.ID, response)

		default:

			/* for bi directional activity: empty case above prevents infinite loop */
			RPCError(remoteWorkerID, request.ID, -32601, "Method not found", errors.New("Method not found"))

		}

	}
}
