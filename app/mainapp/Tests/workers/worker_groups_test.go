package permissiontests

import (
	"dataplane/mainapp/Tests/testutils"
	"dataplane/mainapp/database"
	"log"
	"net/http"
	"strings"
	"testing"

	jsoniter "github.com/json-iterator/go"
	"github.com/stretchr/testify/assert"
)

/*
For individual tests - in separate window run: go run server.go
go test -p 1 -v -count=1 -run TestAccessGroups dataplane/Tests/permissions
* Login
* Get worker groups
* Get workers
* Add secret to worker group
* Get secret's worker groups
* Get worker group's secrets
* Delete secret from worker group
*/
func TestAccessGroups(t *testing.T) {

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

	// -------- Get Worker Groups  -------------

	query := `query {
		getWorkerGroups(
				environmentName: "Development"
				)
			{
				WorkerGroup
            Status
            T
            Interval
            Env
            LB
            WorkerType
			 }
		}`

	response, httpResponse := testutils.GraphQLRequestPrivate(query, accessToken, "{}", graphQLUrlPrivate, t)

	log.Println(string(response))

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Worker groups 200 status code")

	// -------- Get Workers  -------------

	query = `query {
		getWorkers(
				environmentName: "Development"
				) 
			{
			WorkerGroup
            WorkerID
            Status
            T
            Interval
            CPUPerc
            Load
            MemoryPerc
            MemoryUsed
            Env
            LB
            WorkerType
			}
		}`

	response, httpResponse = testutils.GraphQLRequestPrivate(query, accessToken, "{}", graphQLUrlPrivate, t)

	log.Println(string(response))

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Get workers 200 status code")

	// -------- Add secret to worker group  -------------

	mutation := `mutation {
			addSecretToWorkerGroup(
				environmentName: "Development",
				WorkerGroup: "Test",
				Secret: "Test_Secret"
			)
		}`

	response, httpResponse = testutils.GraphQLRequestPrivate(mutation, accessToken, "{}", graphQLUrlPrivate, t)

	log.Println(string(response))

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Add secret to worker group 200 status code")

	// -------- Get secret's worker groups -------------

	query = `query {
			getSecretGroups(
					environmentName: "Development",
					Secret: "Test_Secret"
					)
				{
					SecretID
					WorkerGroupID
					Active
				 }
			}`

	response, httpResponse = testutils.GraphQLRequestPrivate(query, accessToken, "{}", graphQLUrlPrivate, t)

	log.Println(string(response))

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Secret's worker groups 200 status code")

	// -------- Get worker group's secrets -------------

	query = `query {
		getWorkerGroupSecrets(
					environmentName: "Development",
					WorkerGroup: "Test"
					)
				{
					Secret
					SecretType
					Description
					EnvVar
					Active
					EnvironmentId
				 }
			}`

	response, httpResponse = testutils.GraphQLRequestPrivate(query, accessToken, "{}", graphQLUrlPrivate, t)

	log.Println(string(response))

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Worker group's secrets 200 status code")

	// -------- Delete secret from worker group  -------------

	mutation = `mutation {
			deleteSecretFromWorkerGroup(
				environmentName: "Development",
				WorkerGroup: "Test",
				Secret: "Test_Secret"
			)
		}`

	response, httpResponse = testutils.GraphQLRequestPrivate(mutation, accessToken, "{}", graphQLUrlPrivate, t)

	log.Println(string(response))

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Delete secret from worker group 200 status code")

}
