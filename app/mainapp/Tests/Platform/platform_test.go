package admintests

import (
	"dataplane/mainapp/Tests/testutils"
	"dataplane/mainapp/database"
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
go test -p 1 -v -count=1 -run TestPlatform dataplane/Tests/Platform
* Login as admin
* Get platform
* Update platform
*/
func TestPlatform(t *testing.T) {

	database.DBConnect()

	graphQLUrl := testutils.GraphQLUrlPublic
	graphQLUrlPrivate := testutils.GraphQLUrlPrivate

	AdminUser := testutils.AdminUser
	AdminPassword := testutils.AdminPassword

	//--------- Login ------------

	loginUser := `{
		loginUser(
		  username: "` + AdminUser + `",  
		  password: "` + AdminPassword + `",
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

	// -------- Get platform  -------------
	getPlatform := `{
		getPlatform{
			id
			business_name
			timezone
			complete
		}
	}`

	accessToken := jsoniter.Get(loginUserResponse, "data", "loginUser", "access_token").ToString()
	response, httpResponse := testutils.GraphQLRequestPrivate(getPlatform, accessToken, "{}", graphQLUrlPrivate, t)
	platformId := jsoniter.Get(response, "data", "getPlatform", "id").ToString()

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Get environments 200 status code")

	// -------- Update platform  -------------

	updatePlatform := `mutation {
			updatePlatform(
				input: {
					id: "` + platformId + `",
					business_name: "Acme",
					timezone: "` + faker.Timezone() + `",
					complete: true
				}
			)
		}`

	editEnvResponse, httpResponse := testutils.GraphQLRequestPrivate(updatePlatform, accessToken, "{}", graphQLUrlPrivate, t)

	log.Println(string(editEnvResponse))

	if strings.Contains(string(editEnvResponse), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Add Environment 200 status code")

}
