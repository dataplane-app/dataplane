package remoteworker

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"time"

	dpconfig "github.com/dataplane-app/dataplane/app/mainapp/config"
	"github.com/dataplane-app/dataplane/app/mainapp/database"
	"github.com/dataplane-app/dataplane/app/mainapp/database/models"
	"github.com/dataplane-app/dataplane/app/mainapp/logging"
	wsockets "github.com/dataplane-app/dataplane/app/mainapp/websockets"
	"github.com/gofiber/websocket/v2"
	"github.com/tidwall/gjson"
	"github.com/tidwall/sjson"
	"gorm.io/gorm/clause"
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
		var messagetype string
		var sessionID string

		messagestring := string(message)
		if gjson.Get(messagestring, "method").Exists() {
			messagetype = "request"
		}

		if gjson.Get(messagestring, "result").Exists() {
			messagetype = "response"
		}

		if gjson.Get(messagestring, "error").Exists() {
			messagetype = "error"
		}

		// log.Println("JSON RPC type: ", messagetype)

		/* Get the session token based on the RPC message type */
		switch messagetype {
		case "request":
			sessionID = gjson.Get(messagestring, "params.auth").String()
		case "response":
			sessionID = gjson.Get(messagestring, "result.auth").String()
			/* remove auth token from message to prevent passing into front end websockets */
			messagestring, _ = sjson.Delete(messagestring, "result.auth")
		case "error":
			sessionID = gjson.Get(messagestring, "error.data.auth").String()
			log.Println("WS error: ", string(message))
		default:
			log.Println("RPC message type not found.")
			Unregister <- Subscription{Conn: conn, WorkerID: remoteWorkerID}
			conn.WriteMessage(websocket.CloseMessage, []byte{})
			conn.Close()
		}

		/* If the token doesn't exist then close the session */
		if sessionID == "" {
			log.Println("RPC session token not found.")
			Unregister <- Subscription{Conn: conn, WorkerID: remoteWorkerID}
			conn.WriteMessage(websocket.CloseMessage, []byte{})
			conn.Close()
		}

		// log.Println("session token:", sessionID)

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

			/* Send to frontend the status and time of worker - one worker will have multiple environments */
			sendmsg := models.RPAWorkerOnlineWS{
				Time:     time.Now().UTC(),
				Status:   "Online",
				WorkerID: remoteWorkerID,
			}

			sendme, _ := json.Marshal(sendmsg)

			// log.Println(string(sendme))

			room := "remoteworkeronline." + remoteWorkerID
			wsockets.Broadcast <- wsockets.Message{Room: room, Data: sendme}

		/* ----- Run code logs -------- */
		case "coderunfilelogs":

			envID := gjson.Get(messagestring, "params.environment_id").String()
			runID := gjson.Get(messagestring, "params.run_id").String()
			logType := gjson.Get(messagestring, "params.log_type").String()

			log.Println(string(message))

			// log.Println("code run envID:", envID, messagestring)

			if envID == "" {
				RPCError(remoteWorkerID, request.ID, -32603, "Code run missing environment ID", errors.New("Code run missing environment ID"))
				break
			}

			room := "coderunfilelogs." + envID + "." + runID
			log.Println("Room:", room)
			wsockets.Broadcast <- wsockets.Message{Room: room, Data: request.Params}

			if logType == "action" {
				logmsg := gjson.Get(messagestring, "params.log").String()

				msg := models.CodeRun{
					RunID:         runID,
					EnvironmentID: envID,
					Reason:        "Complete",
					EndedAt:       time.Now().UTC(),
				}

				switch logmsg {
				case "Success":
					msg.Status = logmsg
				case "Fail":
					msg.Status = logmsg
				}

				if msg.Status != "" {
					err2 := database.DBConn.Clauses(clause.OnConflict{
						Columns:   []clause.Column{{Name: "run_id"}},
						DoUpdates: clause.AssignmentColumns([]string{"ended_at", "status", "reason"}),
					}).Create(&msg)
					if err2.Error != nil {
						logging.PrintSecretsRedact(err2.Error.Error())
					}
				}

			}

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
