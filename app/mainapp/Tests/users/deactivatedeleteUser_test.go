package usertests

import (
	"log"
	"net/http"
	"strings"
	"testing"

	"github.com/dataplane-app/dataplane/mainapp/Tests/testutils"

	"github.com/bxcodec/faker/v3"
	jsoniter "github.com/json-iterator/go"
	"github.com/stretchr/testify/assert"
)

/*
For individual tests - in separate window run: go run server.go
go test -p 1 -v -count=1 -run TestDeactivateDeleteUser dataplane/Tests/users
* Create admin user and platform
* Login
* Create a user
* Deactivate user
* Activate user
* Delete user
*/
func TestDeactivateDeleteUser(t *testing.T) {

	// Delete platform for testing first time user
	graphQLUrl := testutils.GraphQLUrlPublic
	graphQLUrlPrivate := testutils.GraphQLUrlPrivate

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

	loginAdminResponse, httpLoginResponse := testutils.GraphQLRequestPublic(loginUser, "{}", graphQLUrl, t)

	log.Println(string(loginAdminResponse))

	if strings.Contains(string(loginAdminResponse), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	// Get access token for logged in Admin
	accessTokenAdmin := jsoniter.Get(loginAdminResponse, "data", "loginUser", "access_token").ToString()

	assert.Equalf(t, http.StatusOK, httpLoginResponse.StatusCode, "Login admin 200 status code")

	//--------- Create user ------------
	createUser := `mutation {
				createUser(input: {
				first_name: "` + testutils.TestUser + `",
				last_name: "TestUserLastName",
				email: "` + faker.Email() + `",
				job_title: "",
				password: "` + testutils.TextEscape(faker.Password()) + `",
				timezone: " ` + faker.Timezone() + ` "
				}) {
				user_id
				first_name
				last_name
				email
				timezone
				}
				}`

	createUserResponse, httpResponse := testutils.GraphQLRequestPrivate(createUser, accessTokenAdmin, "{}", graphQLUrlPrivate, t)

	log.Println(string(createUserResponse))
	testUserID := jsoniter.Get(createUserResponse, "data", "createUser", "user_id").ToString()

	if strings.Contains(string(createUserResponse), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Create user 200 status code")

	// --------- Deactivate User --------------
	deactivateUser := `mutation {
		updateDeactivateUser(
			userid: "` + testUserID + `"
		) 
	}`

	response, httpResponse := testutils.GraphQLRequestPrivate(deactivateUser, accessTokenAdmin, "{}", graphQLUrlPrivate, t)

	log.Println(string(response))

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Deactivate user 200 status code")

	// --------- Activate User --------------
	activateUser := `mutation {
			updateActivateUser(
				userid: "` + testUserID + `"
			) 
		}`

	response, httpResponse = testutils.GraphQLRequestPrivate(activateUser, accessTokenAdmin, "{}", graphQLUrlPrivate, t)

	log.Println(string(response))

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Activate user 200 status code")

	// --------- Delete User --------------
	deleteUser := `mutation {
			updateDeleteUser(
				userid: "` + testUserID + `"
			) 
		}`

	delResponse, httpResponse := testutils.GraphQLRequestPrivate(deleteUser, accessTokenAdmin, "{}", graphQLUrlPrivate, t)

	log.Println(string(delResponse))

	if strings.Contains(string(delResponse), `"errors":`) {
		t.Errorf("Error in graphql response")
	}
	log.Println("test user id", testUserID)

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Delete user 200 status code")

}
