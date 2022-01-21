package secrettests

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
go test -p 1 -v -count=1 -run TestSecrets dataplane/Tests/secrets
* Login
* Create secret
* Update secret
* Update secret value
* Get secret
* Get secrets
* Delete secret
*/
func TestSecrets(t *testing.T) {

	database.DBConnect()

	graphQLUrl := "http://localhost:9000/public/graphql"
	graphQLUrlPrivate := "http://localhost:9000/private/graphql"

	testUser := testutils.AdminUser
	testPassword := testutils.AdminPassword

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
	accessToken := jsoniter.Get(loginUserResponse, "data", "loginUser", "access_token").ToString()

	log.Println(string(loginUserResponse))

	if strings.Contains(string(loginUserResponse), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpLoginResponse.StatusCode, "Login user 200 status code")

	envID := testutils.TestEnvironmentID
	if testutils.TestEnvironmentID == "" {
		envID = "test-environment-id"
	}

	// -------- Create Secret -------------
	mutation := `mutation {
		createSecret(input:{
			Secret: "testing",
			Description: "Secret description",
			Value: "Hello123!",
			Active: true,
			EnvironmentId: "` + envID + `"
		}
		){
			Secret
			SecretType
			Description
			EnvVar
			Active
			UpdatedAt
		  }
	}`

	response, httpResponse := testutils.GraphQLRequestPrivate(mutation, accessToken, "{}", graphQLUrlPrivate, t)
	// accessgroup := jsoniter.Get(response, "data", "createAccessGroup").ToString()

	log.Println(string(response))

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Create secret 200 status code")

	// -------- Update Secret -------------
	mutation = `mutation {
		updateSecret(input:{
			Secret: "testing",
			Description: "Secret description updated",
			Active: true,
			EnvironmentId: "` + envID + `"
		}
		){
			Secret
			SecretType
			Description
			EnvVar
			Active
			UpdatedAt
		  }
	}`

	response, httpResponse = testutils.GraphQLRequestPrivate(mutation, accessToken, "{}", graphQLUrlPrivate, t)

	log.Println(string(response))

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Update secret 200 status code")

	// -------- Update Secret Value -------------
	mutation = `mutation {
		updateSecretValue(
			secret: "testing",
			value: "Hello123!!",
			environmentId: "` + envID + `"
		)
	}`

	response, httpResponse = testutils.GraphQLRequestPrivate(mutation, accessToken, "{}", graphQLUrlPrivate, t)

	log.Println(string(response))

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Update secret value 200 status code")

	// -------- Get Secret -------------
	query := `query {
		getSecret(
				secret: "testing",
				environmentId: "` + envID + `"
			){
				Secret
				SecretType
				Description
				EnvVar
				UpdatedAt
			  }
		}`

	response, httpResponse = testutils.GraphQLRequestPrivate(query, accessToken, "{}", graphQLUrlPrivate, t)

	log.Println(string(response))

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Get secret 200 status code")

	// -------- Get Secrets -------------
	query = `query {
			getSecrets(
					environmentId: "` + envID + `"
				){
					Secret
					SecretType
					Description
					EnvVar
					UpdatedAt
				  }
			}`

	response, httpResponse = testutils.GraphQLRequestPrivate(query, accessToken, "{}", graphQLUrlPrivate, t)

	log.Println(string(response))

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Get secrets 200 status code")

	// -------- Delete Secret -------------
	mutation = `mutation {
		updateDeleteSecret(
				secret: "testing",
				environmentId: "` + envID + `"
			)
		}`

	response, httpResponse = testutils.GraphQLRequestPrivate(mutation, accessToken, "{}", graphQLUrlPrivate, t)

	log.Println(string(response))

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Delete secret 200 status code")
}
