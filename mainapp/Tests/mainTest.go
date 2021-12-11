package main

import (
	"dataplane/Tests/testutils"
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
)

/*
Inputs
domain: 127.0.0.1:8000
route: /permission
response: {"r": "OK", "msg": "Permission created", "count": 1}
*/
func MockingBird() string {

	// create a listener with the desired port.
	// log.Fatal()
	testutils.App = routes.Setup()
	err := testutils.App.Listen("0.0.0.0:9000")
	// testutils.App.Listener()
	if err != nil {
		log.Fatal(err)
	}

	// router.POST(route, ResponseMockVar(response, responsecode))
	// ts := httptest.NewUnstartedServer(adaptor.FiberApp(testutils.App))

	// NewUnstartedServer creates a listener. Close that listener and replace
	// with the one we created.
	// ts.Listener.Close()
	// ts.Listener = l

	// defer ts.Close()

	// log.Println("Mockingbird server started:", domain, route)

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

	// log.Println(string(createUserResponse), httpResponse.StatusCode)

	if strings.Contains(string(createUserResponse), `"errors":`) {
		log.Println(string(createUserResponse))
		panic("Error in graphql response")
	}

	if http.StatusOK != httpResponse.StatusCode {
		log.Println("Error in graphql response", httpResponse.StatusCode, http.StatusOK)
		panic("Error in graphql response")
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
