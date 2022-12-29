package remoteworker

import (
	"encoding/json"
	"errors"
	"log"

	"github.com/dataplane-app/dataplane/app/mainapp/database/models"
)

/* This function returns an error for JSON RPC 2.0 */
func RPCError(remoteWorkerID string, requestID string, errCode int64, errMessage string, err error) {
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
	Broadcast <- Message{WorkerID: remoteWorkerID, Data: responseBytes}
	// if err := conn.WriteMessage(websocket.TextMessage, responseBytes); err != nil {
	// 	log.Println("websocket write error:", err)
	// }
}

/* This function returns an valid response for JSON RPC 2.0 */
func RPCResponse(remoteWorkerID string, requestID string, Result any) {
	resultBytes, errmarshal := json.Marshal(Result)
	// Return an error if failed to marshal
	if errmarshal != nil {
		RPCError(remoteWorkerID, requestID, -32700, "RPC response parse error", errmarshal)
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
		RPCError(remoteWorkerID, requestID, -32700, "RPC response parse error", errmarshal2)
		return
	}

	if errmarshal2 != nil {
		RPCError(remoteWorkerID, requestID, -32700, "RPC response parse error", errmarshal2)
		return
	}

	Broadcast <- Message{WorkerID: remoteWorkerID, Data: responseBytes}
	// if err := conn.WriteMessage(websocket.TextMessage, responseBytes); err != nil {
	// 	log.Println("websocket write error:", err)
	// }
}

/* This function creates a valid request for JSON RPC 2.0 */
func RPCRequest(remoteWorkerID string, requestID string, Method string, Params any) error {

	paramsBytes, errmarshal := json.Marshal(Params)
	// Return an error if failed to marshal
	if errmarshal != nil {
		return errors.New("RPC request parse error: " + errmarshal.Error())
	}

	rpcRequest := models.RPCRequest{
		Version: "2.0",
		ID:      requestID,
		Method:  Method,
		Params:  paramsBytes,
	}

	requestBytes, errmarshal2 := json.Marshal(rpcRequest)
	// Return an error if failed to marshal
	if errmarshal2 != nil {
		return errors.New("RPC request parse error 2: " + errmarshal2.Error())
	}

	Broadcast <- Message{WorkerID: remoteWorkerID, Data: requestBytes}

	return nil
}
