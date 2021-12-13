package permissiontests

import (
	"dataplane/Tests/testutils"
	"dataplane/database"
	"log"
	"net/http"
	"strings"
	"testing"

	"github.com/google/uuid"
	jsoniter "github.com/json-iterator/go"
	"github.com/stretchr/testify/assert"
)

/*
For individual tests - in separate window run: go run server.go
go test -p 1 -v -count=1 -run TestPermissions dataplane/Tests/permissions
* Login
* Get environments
*/
func TestPermissions(t *testing.T) {

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
	// -------- Grant permissions to user  -------------
	usertoaddperm := "test-" + uuid.NewString()
	mutation := `mutation {
		updatePermissionToUser(
					environmentID: "` + envID + `",
					resource: "specific_worker",
					resourceID: "test-` + uuid.NewString() + `",
					user_id: "` + usertoaddperm + `",
					access: "write",
				)
			}`

	response, httpResponse := testutils.GraphQLRequestPrivate(mutation, accessToken, "{}", graphQLUrlPrivate, t)
	permid := jsoniter.Get(response, "data", "updatePermissionToUser").ToString()

	log.Println(string(response))

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Get environments 200 status code")

	// -------- Get my permissions  -------------
	query := `{
		myPermissions{
		ID
		Subject
		SubjectID
		Resource
		ResourceID
		Access
		Active
		EnvironmentID
		}
	}`

	response, httpResponse = testutils.GraphQLRequestPrivate(query, accessToken, "{}", graphQLUrlPrivate, t)

	log.Println(string(response))

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Get environments 200 status code")

	// -------- Get user permissions  -------------
	query = `{
		userPermissions(userID: "` + usertoaddperm + `", environmentID: "` + envID + `"){
			ID
			Subject
			SubjectID
			Resource
			ResourceID
			Access
			Active
			EnvironmentID
			}
		}`

	response, httpResponse = testutils.GraphQLRequestPrivate(query, accessToken, "{}", graphQLUrlPrivate, t)

	log.Println(string(response))

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Get environments 200 status code")

	// -------- Revoke permissions from user  -------------
	mutation = `mutation {
			deletePermissionToUser(
				environmentID: "` + envID + `",
				user_id: "` + usertoaddperm + `",
				permission_id: "` + permid + `",
			)
		}`

	response, httpResponse = testutils.GraphQLRequestPrivate(mutation, accessToken, "{}", graphQLUrlPrivate, t)

	log.Println(string(response))

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}
}
