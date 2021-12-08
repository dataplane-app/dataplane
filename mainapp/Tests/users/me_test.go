package tests

import (
	tests "dataplane/Tests"
	"dataplane/database"
	"dataplane/database/models"
	"dataplane/routes"
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
	app := routes.Setup()

	// Delete platform for testing first time user
	database.DBConn.Where("1 = 1").Delete(&models.Platform{})

	graphQLUrl := "http://localhost:9000/public/graphql"
	graphQLUrlPrivate := "http://localhost:9000/private/graphql"

	testUser := tests.AdminUser
	testPassword := tests.AdminPassword
	// Remove admin user
	database.DBConn.Where("username = ?", testUser).Delete(&models.Users{})
	// Remove environments
	database.DBConn.Where("1 = 1").Delete(&models.Environment{})

	//--------- Create user ------------
	createUser := `mutation {
				setupPlatform(
					input: {
						PlatformInput: { 
							business_name: "` + faker.DomainName() + `",,
							timezone: " ` + faker.Timezone() + ` ",
							complete: true }
						AddUsersInput: {
							first_name: "` + faker.FirstName() + `",
							last_name: "` + faker.LastName() + `",
							email: "` + testUser + `",
							job_title: "` + faker.Name() + `",
							password: "` + testPassword + `",
							timezone: " ` + faker.Timezone() + ` ",
						}
					}
				) {
					Platform {
						id
						business_name
						timezone
						complete
					}
					User {
						user_id
						user_type
						first_name
						last_name
						email
						job_title
						timezone
					}
					Auth{
						access_token
						refresh_token
				}
				}
			}`

	createUserResponse, httpResponse := tests.GraphQLRequestPublic(createUser, "{}", graphQLUrl, t, app)

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

	loginUserResponse, httpLoginResponse := tests.GraphQLRequestPublic(loginUser, "{}", graphQLUrl, t, app)

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
	meResponse, httpMeResponse := tests.GraphQLRequestPrivate(me, accessToken, "{}", graphQLUrlPrivate, t, app)

	log.Println(string(meResponse))

	if strings.Contains(string(meResponse), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpMeResponse.StatusCode, "Create user 200 status code")

	// ------------ UpdateMe ---------------------
	updateMe := `mutation {
		updateMe(
			input: {
				first_name: "` + faker.FirstName() + `",
				last_name: "` + faker.LastName() + `",
				email: "admin@email.com",
				job_title: "Manager"
				timezone: " ` + faker.Timezone() + ` ",
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
	updatemeResponse, httpUpdateMeResponse := tests.GraphQLRequestPrivate(updateMe, accessToken, "{}", graphQLUrlPrivate, t, app)

	log.Println(string(updatemeResponse))

	if strings.Contains(string(updatemeResponse), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpUpdateMeResponse.StatusCode, "updateMe 200 status code")

}
