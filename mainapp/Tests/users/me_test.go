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
go test -p 1 -v -count=1 -run TestMe dataplane/Tests/users
* Create admin user and platform
* Login
* Get me data
* Update me data
*/
func TestMe(t *testing.T) {

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

	// -------------- Me ---------------------
	me := `{
			me{
				user_id
				first_name
				last_name
				email
				job_title
				timezone
			}
		}`

	accessToken := jsoniter.Get(loginUserResponse, "data", "loginUser", "access_token").ToString()
	meResponse, httpMeResponse := testutils.GraphQLRequestPrivate(me, accessToken, "{}", graphQLUrlPrivate, t)

	log.Println(string(meResponse))

	if strings.Contains(string(meResponse), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpMeResponse.StatusCode, "Create user 200 status code")

	// ------------ UpdateMe ---------------------
	updateMe := `mutation {
		updateMe(
			input: {
				first_name: "` + testutils.TextEscape(faker.FirstName()) + `",
				last_name: "` + testutils.TextEscape(faker.LastName()) + `",
				email: "` + testutils.AdminUser + `",
				job_title: "Manager"
				timezone: "` + faker.Timezone() + `",
			}
		) {
			user_id
			first_name
			last_name
			email
			job_title
			timezone
		}
	}`
	updatemeResponse, httpUpdateMeResponse := testutils.GraphQLRequestPrivate(updateMe, accessToken, "{}", graphQLUrlPrivate, t)

	log.Println(string(updatemeResponse))

	if strings.Contains(string(updatemeResponse), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpUpdateMeResponse.StatusCode, "updateMe 200 status code")

}
