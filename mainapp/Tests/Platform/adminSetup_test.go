package admintests

import (
	"dataplane/Tests/testutils"
	"dataplane/auth"
	"log"
	"net/http"
	"strings"
	"testing"

	jsoniter "github.com/json-iterator/go"
	"github.com/stretchr/testify/assert"
)

/*
For individual tests - in separate window run: go run server.go
go test -p 1 -v -count=1 -run TestAdminSetup dataplane/Tests/Platform
* Create admin user and platform
* Login
* Validate token
* Exchange refresh token for access token
* Logout
*/
func TestAdminSetup(t *testing.T) {

	testUser := testutils.AdminUser
	testPassword := testutils.AdminPassword

	graphQLUrl := "http://localhost:9000/public/graphql"

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

	// --------- Validate token --------------
	accessToken := jsoniter.Get(loginUserResponse, "data", "loginUser", "access_token").ToString()
	refreshToken := jsoniter.Get(loginUserResponse, "data", "loginUser", "refresh_token").ToString()
	validatetoken, _ := auth.ValidateAccessToken(accessToken)
	assert.Equalf(t, true, validatetoken, "Access token validation")

	//--------- Exchange refresh token for access token ------------
	// log.Println(refreshToken)

	reqQuery := `
	{
		"refresh_token": "` + refreshToken + `"
	}
	`

	url := "http://localhost:9000/refreshtoken"
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
	graphQLPrivateUrl := "http://localhost:9000/private/graphql"
	logoutUserResponse, httpLogoutResponse := testutils.GraphQLRequestPrivate(logoutUser, accessTokenExchange, "{}", graphQLPrivateUrl, t)
	assert.Equalf(t, http.StatusOK, httpLogoutResponse.StatusCode, "Logout 200 status code")
	assert.Equalf(t, "Logged out", jsoniter.Get(logoutUserResponse, "data", "logoutUser").ToString(), "Logout correct response")

}
