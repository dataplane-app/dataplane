package testutils

import (
	"bytes"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"strings"
	"testing"
)

func GraphQLRequestPublic(reqQuery string, reqVariables string, url string, t *testing.T) (responseBody []byte, res *http.Response) {

	client := &http.Client{}
	data := `{
		"query": "%s",
		"variables": %s
	}`
	query := reqQuery
	query = strings.ReplaceAll(query, "\n", `\n`)
	query = strings.ReplaceAll(query, "\t", `\t`)
	query = strings.ReplaceAll(query, "\"", `\"`)

	variables := reqVariables
	data = fmt.Sprintf(data, query, variables)

	log.Println("Payload:", data)

	req, err := http.NewRequest("POST", url, bytes.NewBuffer([]byte(data)))
	if err != nil {
		t.Error(err)
	}

	req.Header.Add("Content-Type", "application/json")

	// res, err = app.Test(req, -1)
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
