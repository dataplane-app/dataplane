package testutils

import (
	"bytes"
	"io/ioutil"
	"log"
	"net/http"
	"testing"
)

func RestRequestPrivate(reqQuery string, token string, method string, url string, t *testing.T) (responseBody []byte, res *http.Response) {

	client := &http.Client{}
	query := reqQuery
	// query = strings.ReplaceAll(query, "\n", `\n`)
	// query = strings.ReplaceAll(query, "\t", `\t`)
	// query = strings.ReplaceAll(query, "\"", `\"`)

	log.Println("Payload:", query)

	req, err := http.NewRequest(method, url, bytes.NewBuffer([]byte(query)))
	if err != nil {
		t.Error(err)
	}

	req.Header.Add("Content-Type", "application/json")
	req.Header.Add("Authorization", "Bearer "+token)

	res, err = client.Do(req)
	if err != nil {
		t.Error(err)
	}

	defer res.Body.Close()

	responseBody, err = ioutil.ReadAll(res.Body)
	if err != nil {
		t.Error(err)
	}

	return responseBody, res
}
