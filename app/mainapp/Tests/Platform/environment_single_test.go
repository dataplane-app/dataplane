package admintests

import (
	"dataplane/mainapp/Tests/testutils"
	"dataplane/mainapp/database"
	"dataplane/mainapp/database/models"
	"log"
	"net/http"
	"strings"
	"testing"

	jsoniter "github.com/json-iterator/go"
	"github.com/stretchr/testify/assert"
)

/*
For individual tests - in separate window run: go run server.go
go test -p 1 -v -count=1 -run TestGetSingleEnvironment dataplane/Tests/Platform
* Login
* Get environments
*/
func TestGetSingleEnvironment(t *testing.T) {

	database.DBConnect()

	graphQLUrl := testutils.GraphQLUrlPublic
	graphQLUrlPrivate := testutils.GraphQLUrlPrivate

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

	var environmentID models.Environment
	database.DBConn.Where("name=?", "Development").First(&environmentID)

	// -------- Get environments  -------------
	// getEnvironment(environment_id: String!): Environments
	getEnvironment := `
	{
		getEnvironment(
			environment_id: "` + environmentID.ID + `",
		){
			id
			name
			description
		}
	}`

	accessToken := jsoniter.Get(loginUserResponse, "data", "loginUser", "access_token").ToString()
	response, httpResponse := testutils.GraphQLRequestPrivate(getEnvironment, accessToken, "{}", graphQLUrlPrivate, t)

	log.Println(string(response))

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Get environments 200 status code")

	singleEnvironment := jsoniter.Get(response, "data", "getEnvironment", "name").ToString()

	assert.Equalf(t, "Development", singleEnvironment, "Got single enviromnet")

}
