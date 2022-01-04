package testutils

import (
	"encoding/json"
	"html"
)

func JSONEscape(i string) string {
	b, err := json.Marshal(i)
	if err != nil {
		panic(err)
	}
	s := string(b)
	return s[1 : len(s)-1]
}

func TextEscape(i string) string {
	return html.EscapeString(i)

}
