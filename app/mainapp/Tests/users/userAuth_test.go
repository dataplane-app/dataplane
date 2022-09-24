package usertests

import (
	"log"
	"net/http"
	"strings"
	"testing"

	"github.com/dataplane-app/dataplane/mainapp/Tests/testutils"
	"github.com/dataplane-app/dataplane/mainapp/auth"

	"github.com/bxcodec/faker/v3"
	jsoniter "github.com/json-iterator/go"
	"github.com/stretchr/testify/assert"
)

/*
go test -p 1 -v -count=1 -run TestUserAuth dataplane/Tests/users
* Create user
* Login
* Validate token
* Exchange refresh token for access token
* Logout
*/
func TestUserAuth(t *testing.T) {

	graphQLPublicUrl := testutils.GraphQLUrlPublic

	//--------- Login ------------

	loginAdminUser := `{
			loginUser(
			  username: "` + testutils.AdminUser + `",  
			  password: "` + testutils.AdminPassword + `",
			) {
			  access_token
			  refresh_token
			}
		  }`

	loginAdminUserResponse, _ := testutils.GraphQLRequestPublic(loginAdminUser, "{}", graphQLPublicUrl, t)

	// Get access token
	accessTokenAdmin := jsoniter.Get(loginAdminUserResponse, "data", "loginUser", "access_token").ToString()

	graphQLUrl := testutils.GraphQLUrlPrivate

	testUser := faker.Email()
	testPassword := testutils.TextEscape(faker.Password())

	//--------- Create user ------------
	createUser := `mutation {
			createUser(input: {
			first_name: "` + testutils.TextEscape(faker.FirstName()) + `",
			last_name: "` + testutils.TextEscape(faker.LastName()) + `",
			email: "` + testUser + `",
			job_title: " ` + testutils.TextEscape(faker.Word()) + `",
			password: "` + testPassword + `",
			timezone: " ` + faker.Timezone() + ` "
			}) {
			user_id
			first_name
			last_name
			email
			timezone
			}
			}`

	createUserResponse, httpResponse := testutils.GraphQLRequestPrivate(createUser, accessTokenAdmin, "{}", graphQLUrl, t)

	log.Println(string(createUserResponse))

	if strings.Contains(string(createUserResponse), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Create user 200 status code")

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

	loginUserResponse, httpLoginResponse := testutils.GraphQLRequestPublic(loginUser, "{}", graphQLPublicUrl, t)

	log.Println(string(loginUserResponse))

	if strings.Contains(string(loginUserResponse), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpLoginResponse.StatusCode, "Login user 200 status code")

	// --------- Validate token --------------
	accessToken := jsoniter.Get(loginUserResponse, "data", "loginUser", "access_token").ToString()
	refreshToken := jsoniter.Get(loginUserResponse, "data", "loginUser", "refresh_token").ToString()
	validatetoken, _ := auth.ValidateAccessToken(accessToken)
	assert.Equalf(t, true, validatetoken, "Access token validation")

	//--------- Exchange refresh token for access token ------------
	// log.Println(refreshToken)

	reqQuery := `
	{
	}
	`

	url := testutils.RefreshTokenUrl
	exchangeUserResponse, httpExchangeResponse := testutils.RestRequestPrivate(reqQuery, refreshToken, "POST", url, t)

	// log.Println(string(exchangeUserResponse))
	// log.Println(httpExchangeResponse)
	assert.Equalf(t, http.StatusOK, httpExchangeResponse.StatusCode, "Exchange token 200 status code")
	accessTokenExchange := jsoniter.Get(exchangeUserResponse, "access_token").ToString()

	// log.Println("Exchanged token: ", accessTokenExchange)
	validatetokenExchange, _ := auth.ValidateAccessToken(accessTokenExchange)
	assert.Equalf(t, true, validatetokenExchange, "Exchange access token validation")

	//--------- Logout ------------
	logoutUser := `{
		logoutUser
	  }`
	graphQLPrivateUrl := testutils.GraphQLUrlPrivate
	logoutUserResponse, httpLogoutResponse := testutils.GraphQLRequestPrivate(logoutUser, accessTokenExchange, "{}", graphQLPrivateUrl, t)
	assert.Equalf(t, http.StatusOK, httpLogoutResponse.StatusCode, "Logout 200 status code")
	assert.Equalf(t, "Logged out", jsoniter.Get(logoutUserResponse, "data", "logoutUser").ToString(), "Logout correct response")

}
