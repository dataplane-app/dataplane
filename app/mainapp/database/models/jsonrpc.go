package models

import "encoding/json"

type RPCRequest struct {
	// JSON-RPC version
	Version string `json:"jsonrpc"`
	// Method to be called
	Method string `json:"method"`
	// Parameters for the method
	Params json.RawMessage `json:"params"`
	// Identifier for the request
	ID int64 `json:"id"`
}

// RPCResponse represents a JSON-RPC response
type RPCResponse struct {
	// JSON-RPC version
	Version string `json:"jsonrpc"`
	// Result of the method call
	Result json.RawMessage `json:"result,omitempty"`
	// Error occurred during the method call
	Error *RPCError `json:"error,omitempty"`
	// Identifier for the request
	ID int64 `json:"id"`
}

// RPCError represents an error in a JSON-RPC response
type RPCError struct {
	// Error code
	Code int64 `json:"code"`
	// Error message
	Message string `json:"message"`
	// Additional error data
	Data interface{} `json:"data,omitempty"`
}

type WSChannelMessage struct {
	Data     []byte
	WorkerID string
}

// {"jsonrpc": "2.0", "method": "Arith.Multiply", "params": [42, 23], "id": 1}
