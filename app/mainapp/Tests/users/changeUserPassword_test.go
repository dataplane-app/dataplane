package usertests

import (
	"log"
	"net/http"
	"strings"
	"testing"

	"github.com/dataplane-app/dataplane/app/mainapp/Tests/testutils"

	jsoniter "github.com/json-iterator/go"
	"github.com/stretchr/testify/assert"
)

/*
For individual tests - in separate window run: go run server.go
go test -p 1 -v -count=1 -run TestChangePassword dataplane/Tests/users
* Create admin user and platform
* Login
* Change password
*/
func TestChangeUserPassword(t *testing.T) {

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

	loginUserResponse, httpLoginResponse := testutils.GraphQLRequestPublic(loginUser, "{}", graphQLUrl, t)

	log.Println(string(loginUserResponse))

	if strings.Contains(string(loginUserResponse), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpLoginResponse.StatusCode, "Login user 200 status code")

	// --------- Change password -----------
	changePassword := `mutation {
		updateChangePassword(
			input: {
				password: "Hello123!",
				user_id: " ` + testutils.UserData["changeuserpassword"].Username + `"
			}
		)
	}`

	accessToken := jsoniter.Get(loginUserResponse, "data", "loginUser", "access_token").ToString()
	changePasswordResponse, httpResponse := testutils.GraphQLRequestPrivate(changePassword, accessToken, "{}", graphQLUrlPrivate, t)

	log.Println(string(changePasswordResponse))

	if strings.Contains(string(changePasswordResponse), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Change password 200 status code")
}
