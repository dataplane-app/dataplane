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
go test -p 1 -v -count=1 -run TestDeactivateDeleteUser dataplane/Tests/users
* Create admin user and platform
* Login
* Create a user
* Deactivate user
* Delete user
*/
func TestDeactivateDeleteUser(t *testing.T) {
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

	//--------- Create admin user ------------
	createAdminUser := `mutation {
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

	createAdminResponse, httpResponse := tests.GraphQLRequestPublic(createAdminUser, "{}", graphQLUrl, t, app)

	log.Println(string(createAdminResponse))

	if strings.Contains(string(createAdminResponse), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Create admin 200 status code")

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

	loginAdminResponse, httpLoginResponse := tests.GraphQLRequestPublic(loginUser, "{}", graphQLUrl, t, app)

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
				first_name: "` + tests.TestUser + `",
				last_name: "TestUserLastName",
				email: "` + tests.TestUser + `",
				job_title: "",
				password: "` + tests.AdminPassword + `",
				timezone: " ` + faker.Timezone() + ` ",
				}) {
				user_id
				first_name
				last_name
				email
				timezone
				}
				}`

	createUserResponse, httpResponse := tests.GraphQLRequestPrivate(createUser, accessTokenAdmin, "{}", graphQLUrlPrivate, t, app)

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

	response, httpResponse := tests.GraphQLRequestPrivate(deactivateUser, accessTokenAdmin, "{}", graphQLUrlPrivate, t, app)

	log.Println(string(response))

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Deactivate user 200 status code")

	// --------- Delete User --------------
	deleteUser := `mutation {
			updateDeleteUser(
				userid: "` + testUserID + `"
			) 
		}`

	delResponse, httpResponse := tests.GraphQLRequestPrivate(deleteUser, accessTokenAdmin, "{}", graphQLUrlPrivate, t, app)

	log.Println(string(delResponse))

	if strings.Contains(string(delResponse), `"errors":`) {
		t.Errorf("Error in graphql response")
	}
	log.Println("test user id", testUserID)

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Delete user 200 status code")

}
