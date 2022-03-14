package main

import (
	"dataplane/mainapp/Tests/testutils"
	"dataplane/mainapp/auth"
	"dataplane/mainapp/database"
	"dataplane/mainapp/database/models"
	"dataplane/mainapp/routes"
	workerroutes "dataplane/workers/routes"
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
// func MockingBird() string {

// 	// create a listener with the desired port.
// 	testutils.App = routes.Setup("9000")
// 	err := testutils.App.Listen("0.0.0.0:9000")
// 	if err != nil {
// 		log.Fatal(err)
// 	}

// 	return "hello"

// }

func main() {

	// finish := make(chan bool)

	testutils.DbInstance = "hello"

	// testutils.App = routes.Setup()
	app := routes.Setup("9000")
	go func() {
		log.Println("Main app listening on 9000")
		app.Listen("0.0.0.0:9000")
	}()
	// go MockingBird()
	// mb.Start()

	// log.Println("App:", testutils.App)

	var t *testing.T

	// // ---- create admin user
	// // Delete platform for testing first time user
	// database.DBConn.Where("1 = 1").Delete(&models.Platform{})

	testUser := testutils.AdminUser
	testPassword := testutils.AdminPassword
	// Remove admin user
	database.DBConn.Where("username = ?", testUser).Delete(&models.Users{})
	// Remove environments
	database.DBConn.Where("name <> 'Development'").Delete(&models.Environment{})

	//--------- Create user ------------
	createUser := `mutation {
					setupPlatform(
						input: {
							PlatformInput: {
								business_name: "` + testutils.TextEscape(faker.DomainName()) + `",,
								timezone: "` + faker.Timezone() + `",
								complete: true }
							AddUsersInput: {
								first_name: "` + testutils.TextEscape(faker.FirstName()) + `",
								last_name: "` + testutils.TextEscape(faker.LastName()) + `",
								email: "` + testUser + `",
								job_title: "` + testutils.TextEscape(faker.Name()) + `",
								password: "` + testPassword + `",
								timezone: "` + faker.Timezone() + `",
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

	createUserResponse, httpResponse := testutils.GraphQLRequestPublic(createUser, "{}", testutils.GraphQLUrlPublic, t)

	log.Println(string(createUserResponse), httpResponse.StatusCode)

	if strings.Contains(string(createUserResponse), `"errors":`) {
		log.Println(string(createUserResponse))
		panic("Error in graphql response")
	}

	if http.StatusOK != httpResponse.StatusCode {
		log.Println("Error in graphql response", httpResponse.StatusCode, http.StatusOK)
		panic("Error in graphql response")
	}

	testutils.TestPlatformID = jsoniter.Get(createUserResponse, "data", "setupPlatform", "Platform", "id").ToString()

	// Get environments
	Environments := []models.Environment{}
	var EnvironmentsMap = make(map[string]string)

	err := database.DBConn.Find(&Environments).Error
	if err != nil {
		panic("Failed to load environments")
	}
	for _, a := range Environments {
		EnvironmentsMap[a.Name] = a.ID
	}

	// overall environment
	testutils.TestEnvironmentID = EnvironmentsMap["Development"]

	log.Println("Remove test permissions:")
	// Remove tests permissions
	database.DBConn.Where("test = 't'").Delete(&models.Permissions{})

	// --- Get production environment to add user to ----
	devEnv := models.Environment{}
	database.DBConn.Where("name = ?", "Development").First(&devEnv)

	// Create users
	for i, v := range testutils.UserData {

		log.Println("Create user:", v.Username)
		password, _ := auth.Encrypt(v.Password)

		userData := models.Users{
			UserID:    v.UserID,
			FirstName: testutils.TextEscape(faker.FirstName()),
			LastName:  testutils.TextEscape(faker.LastName()),
			JobTitle:  testutils.TextEscape(faker.Word()),
			Password:  password,
			Email:     v.Username,
			Status:    "active",
			Active:    true,
			Username:  v.Username,
		}

		err := database.DBConn.Clauses(clause.OnConflict{
			UpdateAll: true,
		}).Create(&userData).Error
		if err != nil {
			t.Errorf("Failed to create permission users")
		}

		log.Println("Map environment:", v.Username)
		environmendID := EnvironmentsMap[v.Environment]
		// Map to environments
		err = database.DBConn.Clauses(clause.OnConflict{
			UpdateAll: true,
		}).Create(&models.EnvironmentUser{
			UserID:        userData.UserID,
			EnvironmentID: environmendID,
			Active:        true,
		}).Error
		if err != nil {
			t.Errorf("Failed to map environments to user")
		}

		// Map back to user
		testutils.UserData[i].EnvironmentID = environmendID
		log.Println("After environment map: ", testutils.UserData[i])

		log.Println("Create test permissions:", v.Username)
		// Add in permissions
		for n, x := range v.Permissions {

			switch perms := x.Resource; perms {
			case "admin_platform":
				v.Permissions[n].ResourceID = testutils.TestPlatformID
				v.Permissions[n].EnvironmentID = "d_platform"
			case "platform_environment":
				v.Permissions[n].ResourceID = testutils.TestPlatformID
				v.Permissions[n].EnvironmentID = "d_platform"
			case "environment_add_user":
				v.Permissions[n].ResourceID = devEnv.ID
				v.Permissions[n].EnvironmentID = devEnv.ID
			case "environment_remove_user":
				v.Permissions[n].ResourceID = devEnv.ID
				v.Permissions[n].EnvironmentID = devEnv.ID
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

	log.Println("Stand up worker 👷")
	appworker := workerroutes.Setup("9005")
	go func() {
		log.Println("Worker listening on 9005")
		appworker.Listen("0.0.0.0:9005")
	}()

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
