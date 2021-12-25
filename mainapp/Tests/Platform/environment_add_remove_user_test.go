package admintests

import (
	"dataplane/Tests/testutils"
	"dataplane/database"
	"dataplane/database/models"
	"log"
	"net/http"
	"strings"
	"testing"

	jsoniter "github.com/json-iterator/go"
	"github.com/stretchr/testify/assert"
)

/*
For individual tests - in separate window run: go run server.go
go test -p 1 -v -count=1 -run TestAddRemoveUserEnvironment dataplane/Tests/Platform
* Login
* Get environments
*/
func TestAddRemoveUserEnvironment(t *testing.T) {

	database.DBConnect()

	graphQLUrl := "http://localhost:9000/public/graphql"
	graphQLUrlPrivate := "http://localhost:9000/private/graphql"

	testUser := testutils.UserData["user_environment"].Username
	testPassword := testutils.UserData["user_environment"].Password

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

	// --- Get production environment to add ----
	u := models.Environment{}
	database.DBConn.Where("name = ?", "Production").First(&u)

	// -------- Add user to environment  -------------
	getEnvironment := `mutation {
		addUserToEnvironment(
			user_id: "` + testutils.UserData["user_environment"].UserID + `",
			environment_id: "` + u.ID + `"
		)
	}`

	accessToken := jsoniter.Get(loginUserResponse, "data", "loginUser", "access_token").ToString()
	response, httpResponse := testutils.GraphQLRequestPrivate(getEnvironment, accessToken, "{}", graphQLUrlPrivate, t)

	log.Println(string(response))

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Get environments 200 status code")

	validateResponse := jsoniter.Get(response, "data", "addUserToEnvironment").ToString()

	assert.Equalf(t, "success", validateResponse, "Added user to environment")

	// -------- Remove user from environment  -------------
	getEnvironment = `mutation {
		removeUserFromEnvironment(
				user_id: "` + testutils.UserData["user_environment"].UserID + `",
				environment_id: "` + u.ID + `"
			)
		}`

	response, httpResponse = testutils.GraphQLRequestPrivate(getEnvironment, accessToken, "{}", graphQLUrlPrivate, t)

	log.Println(string(response))

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Get environments 200 status code")

	validateResponse = jsoniter.Get(response, "data", "removeUserFromEnvironment").ToString()

	assert.Equalf(t, "success", validateResponse, "Added user to environment")

}
