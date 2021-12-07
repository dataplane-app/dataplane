package tests

import (
	"bytes"
	"io/ioutil"
	"log"
	"net/http"
	"testing"

	"github.com/gofiber/fiber/v2"
)

func RestRequestPublic(reqQuery string, method string, url string, t *testing.T, app *fiber.App) (responseBody []byte, res *http.Response) {

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

	res, err = app.Test(req, -1)
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
