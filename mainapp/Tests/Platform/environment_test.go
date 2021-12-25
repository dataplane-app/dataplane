package admintests

import (
	"dataplane/Tests/testutils"
	"dataplane/database"
	"log"
	"net/http"
	"strings"
	"testing"

	jsoniter "github.com/json-iterator/go"
	gonanoid "github.com/matoous/go-nanoid/v2"
	"github.com/stretchr/testify/assert"
)

/*
For individual tests - in separate window run: go run server.go
go test -p 1 -v -count=1 -run TestEnvironment dataplane/Tests/Platform
* Create admin user and platform
* Login
* Get environments
* Add environment
* Rename environment
*/
func TestEnvironment(t *testing.T) {

	database.DBConnect()

	graphQLUrl := "http://localhost:9000/public/graphql"
	graphQLUrlPrivate := "http://localhost:9000/private/graphql"

	testUser := testutils.UserData["environment"].Username
	testPassword := testutils.UserData["environment"].Password

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

	loginUserResponse, httpLoginResponse := testutils.GraphQLRequestPublic(loginUser, "{}", graphQLUrl, t)

	log.Println(string(loginUserResponse))

	if strings.Contains(string(loginUserResponse), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpLoginResponse.StatusCode, "Login user 200 status code")

	// -------- Get environments  -------------
	getEnvironment := `{
		getEnvironments{
			name
		}
	}`

	accessToken := jsoniter.Get(loginUserResponse, "data", "loginUser", "access_token").ToString()
	response, httpResponse := testutils.GraphQLRequestPrivate(getEnvironment, accessToken, "{}", graphQLUrlPrivate, t)

	log.Println(string(response))

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Get environments 200 status code")

	// -------- Add environment  -------------
	randomid1, _ := gonanoid.New()
	addEnvironment := `mutation {
		addEnvironment(
			input: {
				name: "Staging_add` + randomid1 + `",
			}
		) {
			id
			name
		}
	}`
	addEnvResponse, httpResponse := testutils.GraphQLRequestPrivate(addEnvironment, accessToken, "{}", graphQLUrlPrivate, t)

	log.Println(string(addEnvResponse))

	if strings.Contains(string(addEnvResponse), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Add Environment 200 status code")

	environmenteditID := jsoniter.Get(addEnvResponse, "data", "addEnvironment", "id").ToString()

	// -------- Rename environment  -------------

	randomid2, _ := gonanoid.New()
	renameEnvironment := `mutation {
			renameEnvironment(
				input: {
					id: "` + environmenteditID + `",
					name: "` + testutils.TestEnvironment + randomid2 + `",  
				}
			) {
				name
			}
		}`
	editEnvResponse, httpResponse := testutils.GraphQLRequestPrivate(renameEnvironment, accessToken, "{}", graphQLUrlPrivate, t)

	log.Println(string(editEnvResponse))

	if strings.Contains(string(editEnvResponse), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Add Environment 200 status code")

}
