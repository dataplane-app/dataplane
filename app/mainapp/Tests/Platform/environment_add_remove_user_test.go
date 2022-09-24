package admintests

import (
	"log"
	"net/http"
	"strings"
	"testing"

	"github.com/dataplane-app/dataplane/mainapp/Tests/testutils"
	"github.com/dataplane-app/dataplane/mainapp/database"
	"github.com/dataplane-app/dataplane/mainapp/database/models"

	jsoniter "github.com/json-iterator/go"
	"github.com/stretchr/testify/assert"
)

/*
For individual tests - in separate window run: go run server.go
go test -p 1 -v -count=1 -run TestAddRemoveUserEnvironment dataplane/Tests/Platform
* Login
* Add user to environment
* Get environments
* Remove user from environment
*/
func TestAddRemoveUserEnvironment(t *testing.T) {

	database.DBConnect()

	graphQLUrl := testutils.GraphQLUrlPublic
	graphQLUrlPrivate := testutils.GraphQLUrlPrivate

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
	database.DBConn.Where("name = ?", "Development").First(&u)

	log.Println("Environment ID:", u.ID)

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

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Add user to environment 200 status code")

	validateResponse := jsoniter.Get(response, "data", "addUserToEnvironment").ToString()

	assert.Equalf(t, "success", validateResponse, "Added user to environment")

	// -------- Get user environments  -------------
	query := `{
		getUserEnvironments(
					user_id: "` + testutils.UserData["user_environment"].UserID + `",
					environment_id: "` + u.ID + `"
				){
					id
					name
			   }
			}`

	response, httpResponse = testutils.GraphQLRequestPrivate(query, accessToken, "{}", graphQLUrlPrivate, t)

	log.Println(string(response))

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Get user environments 200 status code")

	validateResponse = jsoniter.Get(response, "data", "getUserEnvironments").ToString()

	// assert.Equalf(t, "success", validateResponse, "Got user environments")

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

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Remove from environment 200 status code")

	validateResponse = jsoniter.Get(response, "data", "removeUserFromEnvironment").ToString()

	assert.Equalf(t, "success", validateResponse, "Removed user from environment")

}
