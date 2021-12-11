package main

import (
	"dataplane/Tests/testutils"
	"dataplane/auth"
	"dataplane/database"
	"dataplane/database/models"
	"dataplane/routes"
	"log"
	"net/http"
	"os"
	"os/exec"
	"strings"
	"testing"

	"github.com/bxcodec/faker/v3"
	"github.com/google/uuid"
	jsoniter "github.com/json-iterator/go"
	"gorm.io/gorm/clause"
)

/*
Inputs
domain: 127.0.0.1:8000
route: /permission
response: {"r": "OK", "msg": "Permission created", "count": 1}
*/
func MockingBird() string {

	// create a listener with the desired port.
	testutils.App = routes.Setup()
	err := testutils.App.Listen("0.0.0.0:9000")
	if err != nil {
		log.Fatal(err)
	}

	return "hello"

}

func main() {

	// finish := make(chan bool)

	testutils.DbInstance = "hello"

	// testutils.App = routes.Setup()
	app := routes.Setup()
	go func() {
		log.Println("Listening on 9000")
		app.Listen("0.0.0.0:9000")
	}()
	// go MockingBird()
	// mb.Start()

	// log.Println("App:", testutils.App)

	var t *testing.T

	// // ---- create admin user
	// // Delete platform for testing first time user
	database.DBConn.Where("1 = 1").Delete(&models.Platform{})

	graphQLUrl := "http://localhost:9000/public/graphql"

	testUser := testutils.AdminUser
	testPassword := testutils.AdminPassword
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

	createUserResponse, httpResponse := testutils.GraphQLRequestPublic(createUser, "{}", graphQLUrl, t)

	log.Println(string(createUserResponse), httpResponse.StatusCode)
	// os.Exit(0)

	if strings.Contains(string(createUserResponse), `"errors":`) {
		log.Println(string(createUserResponse))
		panic("Error in graphql response")
	}

	if http.StatusOK != httpResponse.StatusCode {
		log.Println("Error in graphql response", httpResponse.StatusCode, http.StatusOK)
		panic("Error in graphql response")
	}

	testutils.TestPlatformID = jsoniter.Get(createUserResponse, "data", "setupPlatform", "Platform", "id").ToString()

	// Create users
	for i, v := range testutils.UserData {

		password, _ := auth.Encrypt(v.Password)

		userData := models.Users{
			UserID:   i,
			Password: password,
			Email:    v.Username,
			Status:   "active",
			Active:   true,
			Username: v.Username,
		}

		err := database.DBConn.Clauses(clause.OnConflict{
			UpdateAll: true,
		}).Create(&userData).Error
		if err != nil {
			t.Errorf("Failed to create permission users")
		}

		// Remove tests permissions
		database.DBConn.Where("test = 't'").Delete(&models.Permissions{})

		// Add in permissions
		for n, x := range v.Permissions {

			switch perms := x.Resource; perms {
			case "admin_platform":
				v.Permissions[n].ResourceID = testutils.TestPlatformID
				v.Permissions[n].Environment = "d_platform"
			case "platform_environment":
				v.Permissions[n].ResourceID = testutils.TestPlatformID
				v.Permissions[n].Environment = "d_platform"
			default:

			}

			v.Permissions[n].ID = uuid.NewString()
			v.Permissions[n].Active = true
			v.Permissions[n].Subject = "user"
			v.Permissions[n].SubjectID = i
			v.Permissions[n].Test = "t"

			err := database.DBConn.Create(&v.Permissions[n]).Error
			if err != nil {
				t.Errorf("Failed to create permission users")
			}

		}

	}

	// assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Create user 200 status code")

	// ----- create general user
	log.Println("Main hello 😃")
	runTests()

	log.Println("Tests complete 👍")

	// defer mb.Close()
	// testutils.App.Shutdown()
	// <-finish
	// runTests :=
	os.Exit(0)
}

func runTests() {
	// TODO this flags can be passed from the original command instead.
	cmd := exec.Command("go", "test", "-v", "./...")
	cmd.Env = os.Environ()

	cmd.Stdout = os.Stdout

	if err := cmd.Start(); err != nil {
		log.Fatal(err)
	}

	if err := cmd.Wait(); err != nil {
		log.Fatal(err)
	}
}
