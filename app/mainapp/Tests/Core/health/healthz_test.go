package coretests

import (
	"log"
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"
)

/*
go test -p 1 -v -count=1 -run TestMain/TestHealthz dataplane/Tests
*/
func TestHealthz(t *testing.T) {

	// log.Println("App:", testutils.App)

	// app := tests.App

	url := "http://localhost:9000/healthz"
	//method := "POST"
	// b, err := ioutil.ReadFile("input.graphql")
	// if err != nil {
	// 	t.Error(err)
	// }

	//--------- Send request ------------
	client := &http.Client{}
	req, err := http.NewRequest("GET", url, nil)

	if err != nil {
		t.Error(err)
	}

	res, err := client.Do(req)
	log.Println(res.StatusCode)

	// req.Header.Add("Auth", test.Auth)
	// req.Header.Add("Content-Type", "application/json")

	// res, err := client.Do(req)
	// res, err := testutils.App.Test(req, -1)
	// if err != nil {
	// 	t.Error(err)
	// }

	assert.Equalf(t, http.StatusOK, res.StatusCode, "200 status code")

	log.Print("Response code: ", res.Status)

}
