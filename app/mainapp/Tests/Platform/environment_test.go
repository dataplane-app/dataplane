package admintests

import (
	"dataplane/mainapp/Tests/testutils"
	"dataplane/mainapp/database"
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

	graphQLUrl := testutils.GraphQLUrlPublic
	graphQLUrlPrivate := testutils.GraphQLUrlPrivate

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

	// -------- Add environment  -------------
	randomid1, _ := gonanoid.New()
	addEnvironment := `mutation {
		addEnvironment(
			input: {
				name: "Staging_add` + randomid1 + `",
				description: "Description Staging_add` + randomid1 + `",
			}
		) {
			id
			name
			description
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
			updateEnvironment(
				input: {
					id: "` + environmenteditID + `",
					name: "` + testutils.TestEnvironment + randomid2 + `",  
					description: "Description ` + testutils.TestEnvironment + randomid2 + `",
				}
			) {
				name
				description
			}
		}`
	editEnvResponse, httpResponse := testutils.GraphQLRequestPrivate(renameEnvironment, accessToken, "{}", graphQLUrlPrivate, t)

	log.Println(string(editEnvResponse))

	if strings.Contains(string(editEnvResponse), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Add Environment 200 status code")

	// -------- Deactivate environment  -------------
	deactivateEnvironment := `mutation {
		updateDeactivateEnvironment(
			environment_id: "` + environmenteditID + `"
		)
	}`

	deactivateEnvResponse, httpResponse := testutils.GraphQLRequestPrivate(deactivateEnvironment, accessToken, "{}", graphQLUrlPrivate, t)

	log.Println(string(deactivateEnvResponse))

	if strings.Contains(string(deactivateEnvResponse), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Add Environment 200 status code")

	// -------- Delete environment  -------------
	deleteEnvironment := `mutation {
		updateDeleteEnvironment(
			environment_id: "` + environmenteditID + `"
		)
	}`

	deleteEnvResponse, httpResponse := testutils.GraphQLRequestPrivate(deleteEnvironment, accessToken, "{}", graphQLUrlPrivate, t)

	log.Println(string(deleteEnvResponse))

	if strings.Contains(string(deleteEnvResponse), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Delete Environment 200 status code")

}
