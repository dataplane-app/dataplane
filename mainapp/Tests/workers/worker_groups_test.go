package permissiontests

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
go test -p 1 -v -count=1 -run TestAccessGroups dataplane/Tests/permissions
* Login
* Create access group
* Update access group
* Attach permission to access group
* Attach user to access group
* Get access group's users
* Get user access groups
* Get access groups
* Get access group
* Remove user from access group
* Deactivate Access Group
* Delete Access Group
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

	// -------- Get User's Access Groups  -------------

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

}
