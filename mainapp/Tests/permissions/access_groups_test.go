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
go test -p 1 -v -count=1 -run TestAccessGroups dataplane/Tests/permissions
* Login
* Get environments
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

	envID := testutils.TestEnvironmentID
	if testutils.TestEnvironmentID == "" {
		envID = "test-environment-id"
	}
	// -------- Create Access Group  -------------
	mutation := `mutation {
		createAccessGroup(
			environmentID: "` + envID + `",
			name: " access-group-` + uuid.NewString() + ` ",
		)
	}`

	response, httpResponse := testutils.GraphQLRequestPrivate(mutation, accessToken, "{}", graphQLUrlPrivate, t)
	accessgroup := jsoniter.Get(response, "data", "createAccessGroup").ToString()

	log.Println(string(response))

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Get environments 200 status code")

	// -------- Attach permission to Access Group  -------------
	mutation = `mutation {
		updatePermissionToAccessGroup(
				environmentID: "` + envID + `",
				resource: "specific_pipeline",
				resourceID: "test-` + uuid.NewString() + ` ",
				access_group_id: "` + accessgroup + ` ",
				access: "write",
			)
		}`

	response, httpResponse = testutils.GraphQLRequestPrivate(mutation, accessToken, "{}", graphQLUrlPrivate, t)

	log.Println(string(response))

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Get environments 200 status code")

	// -------- Attach user to Access Group  -------------
	mutation = `mutation {
		updateUserToAccessGroup(
					environmentID: "` + envID + `",
					user_id: "test-` + uuid.NewString() + ` ",
					access_group_id: "` + accessgroup + ` ",
				)
			}`

	response, httpResponse = testutils.GraphQLRequestPrivate(mutation, accessToken, "{}", graphQLUrlPrivate, t)

	log.Println(string(response))

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Get environments 200 status code")

}
