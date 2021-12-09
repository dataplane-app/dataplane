package tests

import (
	tests "dataplane/Tests"
	"dataplane/database"
	"dataplane/database/models"
	"dataplane/logging"
	"dataplane/routes"
	"log"
	"net/http"
	"os"
	"strings"
	"testing"

	"github.com/bxcodec/faker/v3"
	jsoniter "github.com/json-iterator/go"
	"github.com/stretchr/testify/assert"
)

/*
go test -p 1 -v -count=1 -run TestEnvironment dataplane/Tests/users
* Create admin user and platform
* Login
* Get environments
* Add environment
* Rename environment
*/
func TestEnvironment(t *testing.T) {
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

	// -------- Get environments  -------------
	getEnvironment := `{
		getEnvironments{
			name
		}
	}`

	accessToken := jsoniter.Get(loginUserResponse, "data", "loginUser", "access_token").ToString()
	response, httpResponse := tests.GraphQLRequestPrivate(getEnvironment, accessToken, "{}", graphQLUrlPrivate, t, app)

	log.Println(string(response))

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Get environments 200 status code")

	// -------- Add environment  -------------
	addEnvironment := `mutation {
		addEnvironment(
			input: {
				name: "Staging_test_1",  
				active: true,
			}
		) 
	}`
	addEnvResponse, httpResponse := tests.GraphQLRequestPrivate(addEnvironment, accessToken, "{}", graphQLUrlPrivate, t, app)

	log.Println(string(addEnvResponse))

	if strings.Contains(string(addEnvResponse), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Add Environment 200 status code")

	// -------- Rename environment  -------------
	// Retreiving id of previously added environment "Staging_test_1"
	e := models.Environment{}
	err := database.DBConn.Where("name = ?", "Staging_test_1").First(&e).Error
	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		log.Print("Failed to retrieve Staging_test environment model.")
	}

	renameEnvironment := `mutation {
			renameEnvironment(
				input: {
					id: "` + e.ID + `",
					name: "` + tests.TestEnvironment + `",  
				}
			) {
				name
			}
		}`
	editEnvResponse, httpResponse := tests.GraphQLRequestPrivate(renameEnvironment, accessToken, "{}", graphQLUrlPrivate, t, app)

	log.Println(string(editEnvResponse))

	if strings.Contains(string(editEnvResponse), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Add Environment 200 status code")

}
