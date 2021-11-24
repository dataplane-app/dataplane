package test

import (
	"dataplane/routes"
	"log"
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestHealthz(t *testing.T) {

	app := routes.Setup()

	url := "http://localhost:9000/healthz"
	//method := "POST"
	// b, err := ioutil.ReadFile("input.graphql")
	// if err != nil {
	// 	t.Error(err)
	// }

	//--------- Send request ------------
	req, err := http.NewRequest("GET", url, nil)

	if err != nil {
		t.Error(err)
	}

	// req.Header.Add("Auth", test.Auth)
	// req.Header.Add("Content-Type", "application/json")

	// res, err := client.Do(req)
	res, err := app.Test(req, -1)
	if err != nil {
		t.Error(err)
	}

	assert.Equalf(t, http.StatusOK, res.StatusCode, "200 status code")

	log.Print("Response code: ", res.Status)

}
