package formatter

import (
	"bytes"
	"encoding/json"
)

// JSONBytes pretty prints a slice of JSON bytes
func JSONBytes(data []byte) (string, error) {
	var out bytes.Buffer
	err := json.Indent(&out, data, "", "    ")
	if err != nil {
		return "", err
	}
	return string(out.Bytes()), nil
}

// JSONString pretty prints a JSON string
func JSONString(data string) (string, error) {
	return JSONBytes([]byte(data))
}
