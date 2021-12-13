package usertests

import (
	"dataplane/Tests/testutils"
	"dataplane/database"
	"log"
	"net/http"
	"strings"
	"testing"

	jsoniter "github.com/json-iterator/go"
	"github.com/stretchr/testify/assert"
)

/*
For individual tests - in separate window run: go run server.go
go test -p 1 -v -count=1 -run TestGetSingleEnvironment dataplane/Tests/users
* Login
* Get environments
*/
func TestGetSingleEnvironment(t *testing.T) {

	database.DBConnect()

	graphQLUrl := "http://localhost:9000/public/graphql"
	graphQLUrlPrivate := "http://localhost:9000/private/graphql"

	testUser := testutils.UserData["development_env_user"].Username
	testPassword := testutils.UserData["development_env_user"].Password

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

	singleEnvironment := jsoniter.Get(response, "data", "getEnvironments", 0, "name").ToString()
	secondEnvironment := jsoniter.Get(response, "data", "getEnvironments", 1, "name").ToString()

	assert.Equalf(t, "Development", singleEnvironment, "Got single enviromnet")
	assert.Equalf(t, "", secondEnvironment, "Got single enviromnet")

}
