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
go test -p 1 -v -count=1 -run TestPreferences dataplane/Tests/users
* Login admin user
* Get one preference
* Get all preferences
* Update a preference
*/
func TestPreferences(t *testing.T) {

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

	//--------- Get one preference ---------
	getOnePreference := `{
		getOnePreference(
		  preference: "theme",  
		) {
		  value
		}
	  }
	  `

	getOnePreferenceResponse, httpResponse := testutils.GraphQLRequestPrivate(getOnePreference, accessTokenAdmin, "{}", graphQLUrlPrivate, t)

	log.Println(string(getOnePreferenceResponse))

	if strings.Contains(string(getOnePreferenceResponse), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Get one preference 200 status code")

	//--------- Get all preferences ---------
	getAllPreferences := `{
		getAllPreferences{
			preference
			value
		}
	}`

	getAllPreferencesResponse, httpResponse := testutils.GraphQLRequestPrivate(getAllPreferences, accessTokenAdmin, "{}", graphQLUrlPrivate, t)

	log.Println(string(getAllPreferencesResponse))

	if strings.Contains(string(getAllPreferencesResponse), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Get all preferences 200 status code")

	//--------- Update a preference ---------
	updatePreferences := `mutation {
		updatePreferences(
			input:{
				preference: "theme"
				value: "light"
			}
		) 
	}`

	updatePreferencesResponse, httpResponse := testutils.GraphQLRequestPrivate(updatePreferences, accessTokenAdmin, "{}", graphQLUrlPrivate, t)

	log.Println(string(updatePreferencesResponse))

	if strings.Contains(string(updatePreferencesResponse), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Update preference 200 status code")

}
