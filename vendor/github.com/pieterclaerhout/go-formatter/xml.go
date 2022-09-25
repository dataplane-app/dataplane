package formatter

import (
	"bytes"
	"encoding/xml"
	"io"
)

// XML formats an XML string
func XML(xmlString string) (string, error) {

	data := []byte(xmlString)

	b := &bytes.Buffer{}
	decoder := xml.NewDecoder(bytes.NewReader(data))
	encoder := xml.NewEncoder(b)
	encoder.Indent("", "    ")
	for {
		token, err := decoder.Token()
		if err == io.EOF {
			encoder.Flush()
			return string(b.Bytes()), nil
		}
		if err != nil {
			return "", err
		}
		err = encoder.EncodeToken(token)
		if err != nil {
			return "", err
		}
	}

}
