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

	envID := testutils.TestEnvironmentID
	if testutils.TestEnvironmentID == "" {
		envID = "test-environment-id"
	}

	// -------- Create Access Group  -------------
	mutation := `mutation {
		createAccessGroup(
			environmentID: "` + envID + `",
			name: "access-group-` + uuid.NewString() + `",
			description: "description",
		)
	}`

	response, httpResponse := testutils.GraphQLRequestPrivate(mutation, accessToken, "{}", graphQLUrlPrivate, t)
	accessgroup := jsoniter.Get(response, "data", "createAccessGroup").ToString()

	log.Println(string(response))

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Get environments 200 status code")

	// -------- Update Access Group  -------------
	mutation = `mutation {
		updateAccessGroup(input:{
			AccessGroupID: "` + accessgroup + `"
			EnvironmentID: "` + envID + `",
			Name: "access-group-` + uuid.NewString() + `",
			Description: "description",
			Active: true
		}
		)
	}`

	response, httpResponse = testutils.GraphQLRequestPrivate(mutation, accessToken, "{}", graphQLUrlPrivate, t)

	log.Println(string(response))

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Update access group 200 status code")

	// -------- Attach permission to Access Group  -------------
	mutation = `mutation {
		updatePermissionToAccessGroup(
				environmentID: "` + envID + `",
				resource: "environment_secrets",
				resourceID: "test-` + uuid.NewString() + ` ",
				access_group_id: "` + accessgroup + `",
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
	usertoadd := "test-" + uuid.NewString()
	mutation = `mutation {
		updateUserToAccessGroup(
					environmentID: "` + envID + `",
					user_id: "` + usertoadd + `",
					access_group_id: "` + accessgroup + `",
				)
			}`

	response, httpResponse = testutils.GraphQLRequestPrivate(mutation, accessToken, "{}", graphQLUrlPrivate, t)

	log.Println(string(response))

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	// -------- GetAccess Group's users  -------------

	query := `query {
			getAccessGroupUsers(
				environmentID: "` + envID + `",
				access_group_id: "` + accessgroup + `"
				)
			{
				user_id
				first_name
				last_name
				email
				job_title
				timezone
				status
				user_type
			 }
		}`

	log.Println("!!!!!!!!!!!!!!!!!!!!!!!", accessgroup)

	response, httpResponse = testutils.GraphQLRequestPrivate(query, accessToken, "{}", graphQLUrlPrivate, t)

	log.Println(string(response))

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Get access group's users 200 status code")

	// -------- Get User's Access Groups  -------------

	query = `query {
			getUserAccessGroups(
				environmentID: "` + envID + `",
				userID: "` + usertoadd + `"
				) 
			{
				AccessGroupID
				Name
				Active
				EnvironmentID
			}
		}`

	response, httpResponse = testutils.GraphQLRequestPrivate(query, accessToken, "{}", graphQLUrlPrivate, t)

	log.Println(string(response))

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Get user's access groups 200 status code")

	// -------- Get Access Groups  -------------

	query = `query {
					getAccessGroups(
						environmentID: "` + envID + `",
						userID: "` + usertoadd + `") 
					{
						AccessGroupID
						Name
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

	// -------- Get Access Group  -------------

	query = `query {
			getAccessGroup(
				environmentID: "` + envID + `",
				userID: "` + usertoadd + `",
			    access_group_id: "` + accessgroup + `",) 
			{
				AccessGroupID
				Name
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

	// -------- Remove user from access group -------
	mutation = `mutation {
		removeUserFromAccessGroup(
			environmentID: "` + envID + `",
			user_id: "` + usertoadd + `",
			access_group_id: "` + accessgroup + `",
		)
	}`

	response, httpResponse = testutils.GraphQLRequestPrivate(mutation, accessToken, "{}", graphQLUrlPrivate, t)

	log.Println(string(response))

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	// -------- Deactivate Access Group  -------------
	mutation = `mutation {
		deactivateAccessGroup(
				environmentID: "` + envID + `",
				access_group_id: "` + accessgroup + `",
			)
		}`

	response, httpResponse = testutils.GraphQLRequestPrivate(mutation, accessToken, "{}", graphQLUrlPrivate, t)

	log.Println(string(response))

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Get environments 200 status code")

	// -------- Activate Access Group  -------------
	mutation = `mutation {
		activateAccessGroup(
				environmentID: "` + envID + `",
				access_group_id: "` + accessgroup + `",
			)
		}`

	response, httpResponse = testutils.GraphQLRequestPrivate(mutation, accessToken, "{}", graphQLUrlPrivate, t)

	log.Println(string(response))

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Get environments 200 status code")

	// -------- Delete Access Group  -------------
	mutation = `mutation {
			deleteAccessGroup(
				environmentID: "` + envID + `",
				access_group_id: "` + accessgroup + `",
			)
		}`

	response, httpResponse = testutils.GraphQLRequestPrivate(mutation, accessToken, "{}", graphQLUrlPrivate, t)

	log.Println(string(response))

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Get environments 200 status code")

}
