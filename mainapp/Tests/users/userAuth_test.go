package tests

import (
	"bytes"
	"dataplane/routes"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"strings"
	"testing"

	"github.com/bxcodec/faker/v3"
	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
)

func GraphQLrequest(reqQuery string, reqVariables string, url string, t *testing.T, app *fiber.App) (responseBody []byte, res *http.Response) {

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

/*
go test -p 1 -v -count=1 -run TestUserAuth dataplane/Tests/users
*/
func TestUserAuth(t *testing.T) {
	app := routes.Setup()

	graphQLUrl := "http://localhost:9000/public/graphql"

	testUser := faker.Email()
	testPassword := faker.Password()

	//--------- Create user ------------
	createUser := `mutation {
			createUser(input: {
			first_name: "` + faker.FirstName() + `",
			last_name: "` + faker.LastName() + `",
			email: "` + testUser + `",
			password: "` + testPassword + `",
			timezone: " ` + faker.Timezone() + ` ",
			}) {
			user_id
			first_name
			last_name
			email
			timezone
			}
			}`

	createUserResponse, httpResponse := GraphQLrequest(createUser, "{}", graphQLUrl, t, app)

	log.Println(string(createUserResponse))

	if strings.Contains(string(createUserResponse), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Create user 200 status code")

	//--------- Login ------------

	loginUser := `{
		loginUser(
		  username: "` + testUser + `",  
		  password: "` + testPassword + `",
		) {
		  access_token
		  refresh_token
		}
	  }`

	loginUserResponse, httpLoginResponse := GraphQLrequest(loginUser, "{}", graphQLUrl, t, app)

	log.Println(string(loginUserResponse))

	if strings.Contains(string(loginUserResponse), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpLoginResponse.StatusCode, "Login user 200 status code")

	// --------- Validate token --------------

	//--------- Exchange refresh token for access token ------------

	//--------- Logout ------------

	//--------- Send GraphQL request ------------

	// body, err := ioutil.ReadAll(res.Body)
	// if err != nil {
	// 	t.Error(err)
	// }

	// log.Println("Actual response", string(body))

	// //--------- Get the Expected Response ------------
	// b, err = ioutil.ReadFile("./output.json")
	// if err != nil {
	// 	t.Error(err)
	// }

	//--------- Update dynamic columns ------------
	// id := jsoniter.Get(body, "data", "createWorkerBooking", "id").ToString()
	// //orgID := jsoniter.Get(body, "data", "insertProject", "org_id").ToString()
	// expectedOutput, _ := sjson.Set(string(b), "data.createWorkerBooking.id", id)
	// // expectedOutput, _ = sjson.Set(expectedOutput, "data.insertProject.updated_at", jsoniter.Get(body, "data", "insertProject", "updated_at").ToString())
	// // expectedOutput, _ = sjson.Set(expectedOutput, "data.insertProject.id", jsoniter.Get(body, "data", "insertProject", "id").ToString())

	// log.Println("Expected response: ", expectedOutput)

	// assert.JSONEqf(t, expectedOutput, string(body), "Actual to expected output")

}
