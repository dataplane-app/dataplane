package usertests

import (
	"dataplane/Tests/testutils"
	"log"
	"net/http"
	"strings"
	"testing"

	"github.com/bxcodec/faker/v3"
	jsoniter "github.com/json-iterator/go"
	"github.com/stretchr/testify/assert"
)

/*
For individual tests - in separate window run: go run server.go
go test -p 1 -v -count=1 -run TestUpdateUser dataplane/Tests/users
* Create admin user and platform
* Login
* Change user details
*/
func TestUpdateUser(t *testing.T) {

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

	log.Println(string(loginUserResponse))

	if strings.Contains(string(loginUserResponse), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpLoginResponse.StatusCode, "Login user 200 status code")

	// --------- Change user -----------
	change := `mutation {
		updateUser(
			input: {
				user_id: "` + testutils.UserData["changeuser"].UserID + `"
				first_name: "` + faker.FirstName() + `"
				last_name: "` + faker.LastName() + `"
				email: "` + testutils.UserData["changeuser"].Username + `"
				job_title: "` + faker.LastName() + `"
				timezone: "` + faker.Timezone() + `"
			}
		)
	}`

	accessToken := jsoniter.Get(loginUserResponse, "data", "loginUser", "access_token").ToString()
	changeResponse, httpResponse := testutils.GraphQLRequestPrivate(change, accessToken, "{}", graphQLUrlPrivate, t)

	log.Println(string(changeResponse))

	if strings.Contains(string(changeResponse), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Change password 200 status code")
}
