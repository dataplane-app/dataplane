package remoteworker

import (
	"encoding/json"
	"log"

	"github.com/dataplane-app/dataplane/app/mainapp/database/models"
	"github.com/gofiber/websocket/v2"
)

/* This function returns an error for JSON RPC 2.0 */
func RPCError(conn *websocket.Conn, requestID int64, errCode int64, errMessage string, err error) {
	log.Println("jsonrpc error:", err)
	rpcerror := models.RPCError{
		Code:    errCode,
		Message: errMessage,
		Data:    err.Error(),
	}

	rpcResponse := models.RPCResponse{
		Version: "2.0",
		Error:   &rpcerror,
		ID:      requestID,
	}
	responseBytes, _ := json.Marshal(rpcResponse)
	Broadcast <- Message{WorkerID: "fedf703e-82ca-4fab-b401-b7c774285c11", Data: responseBytes}
	// if err := conn.WriteMessage(websocket.TextMessage, responseBytes); err != nil {
	// 	log.Println("websocket write error:", err)
	// }
}

/* This function returns an valid response for JSON RPC 2.0 */
func RPCResponse(conn *websocket.Conn, requestID int64, Result any) {
	resultBytes, errmarshal := json.Marshal(Result)
	// Return an error if failed to marshal
	if errmarshal != nil {
		RPCError(conn, requestID, -32700, "RPC response parse error", errmarshal)
		return
	}

	rpcResponse := models.RPCResponse{
		Version: "2.0",
		ID:      requestID,
		Result:  resultBytes,
	}

	responseBytes, errmarshal2 := json.Marshal(rpcResponse)
	// Return an error if failed to marshal
	if errmarshal != nil {
		RPCError(conn, requestID, -32700, "RPC response parse error", errmarshal2)
		return
	}

	if errmarshal2 != nil {
		RPCError(conn, requestID, -32700, "RPC response parse error", errmarshal2)
		return
	}

	Broadcast <- Message{WorkerID: "fedf703e-82ca-4fab-b401-b7c774285c11", Data: responseBytes}
	// if err := conn.WriteMessage(websocket.TextMessage, responseBytes); err != nil {
	// 	log.Println("websocket write error:", err)
	// }
}
