package pipelinetests

import (
	"bytes"
	"dataplane/mainapp/Tests/testutils"
	"dataplane/mainapp/database"
	"dataplane/mainapp/database/models"
	"dataplane/mainapp/logging"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"testing"

	"github.com/bxcodec/faker/v3"
	"github.com/golang-jwt/jwt/v4"
	"github.com/google/uuid"
	jsoniter "github.com/json-iterator/go"
	"github.com/stretchr/testify/assert"
)

/*
For individual tests - in separate window run: go run server.go
go test -p 1 -v -count=1 -run TestSpecificPipelines dataplane/Tests/pipelines
* Login
* Create pipeline
* My pipeline permissions
* Set pipeline permissions to user
* Get User pipeline permissions
* Get User single pipeline permissions
* Create temporary access group
* Set pipeline permissions to access group
* Get Pipeline permissions
* Remove pipeline permissions from user
* Remove pipeline permissions from access group
* Remove temporary access group
*/
func TestSpecificPipelines(t *testing.T) {

	database.DBConnect()

	graphQLUrl := testutils.GraphQLUrlPublic
	graphQLUrlPrivate := testutils.GraphQLUrlPrivate

	testUser := testutils.AdminUser
	testPassword := testutils.AdminPassword

	//--------- Login ------------
	log.Println("📢 - Login")
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
	accessToken := jsoniter.Get(loginUserResponse, "data", "loginUser", "access_token").ToString()

	// Extract user_id from the token
	claims := jwt.MapClaims{}
	jwt.ParseWithClaims(accessToken, claims, func(token *jwt.Token) (interface{}, error) {
		return []byte("<YOUR VERIFICATION KEY>"), nil
	})
	var userId string
	for key, val := range claims {
		if key == "sub" {
			userId = fmt.Sprint(val)
		}
	}

	var loginUserResponsePretty bytes.Buffer
	json.Indent(&loginUserResponsePretty, []byte(loginUserResponse), "", "\t")
	log.Println(loginUserResponsePretty.String())

	if strings.Contains(string(loginUserResponse), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpLoginResponse.StatusCode, "Login user 200 status code")

	envID := testutils.TestEnvironmentID
	if testutils.TestEnvironmentID == "" {
		envID = "test-environment-id"
	}

	pipelineId := testutils.TextEscape(faker.UUIDHyphenated())

	var responsePretty bytes.Buffer

	// -------- Create pipeline -------------
	log.Println("📢 - Create pipeline")
	mutation := `mutation {
		addPipeline(
			name: "test_` + pipelineId + `",
			environmentID: "` + envID + `",
			description: "Test",
			workerGroup: "python_1"
			)
		}`

	response, httpResponse := testutils.GraphQLRequestPrivate(mutation, accessToken, "{}", graphQLUrlPrivate, t)

	json.Indent(&responsePretty, []byte(response), "", "\t")
	log.Println(responsePretty.String())
	responsePretty.Reset()

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Create pipeline 200 status code")

	p := models.Pipelines{}

	// Get pipeline's id by its name
	err := database.DBConn.Where("name = ?", `test_`+pipelineId).Find(&p).Error

	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		log.Println(errors.New("Retrive pipelines database error."))
	}

	// -------- My pipeline permissions -------------
	log.Println("📢 - My pipeline permissions")

	query := `query {
		myPipelinePermissions{
			Access
			Subject
			SubjectID
			PipelineName
			ResourceID
			EnvironmentID
			Active
			Level
			Label
			FirstName
			LastName
			Email
			JobTitle
			}
		}`

	response, httpResponse = testutils.GraphQLRequestPrivate(query, accessToken, "{}", graphQLUrlPrivate, t)

	json.Indent(&responsePretty, []byte(response), "", "\t")
	log.Println(responsePretty.String())
	responsePretty.Reset()

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Get my pipeline permissions 200 status code")

	// -------- Set pipeline permissions to user -------------
	log.Println("📢 - Set pipeline permissions to user")

	mutation = `mutation {
		pipelinePermissionsToUser(
			environmentID: "` + envID + `",
			resourceID: "` + p.PipelineID + `",
			user_id: "` + userId + `",
			access: ["read", "write", "run"]
			)
		}`

	response, httpResponse = testutils.GraphQLRequestPrivate(mutation, accessToken, "{}", graphQLUrlPrivate, t)

	json.Indent(&responsePretty, []byte(response), "", "\t")
	log.Println(responsePretty.String())
	responsePretty.Reset()

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Pipeline permissions to user 200 status code")

	// -------- Get User pipeline permissions -------------
	log.Println("📢 - Get User pipeline permissions")

	query = `query {
		userPipelinePermissions(
			userID: "` + userId + `",
			environmentID: "` + envID + `",
			){
				Access
				Subject
				SubjectID
				PipelineName
				ResourceID
				EnvironmentID
				Active
				Level
				Label
				FirstName
				LastName
				Email
				JobTitle
			}
		}`

	response, httpResponse = testutils.GraphQLRequestPrivate(query, accessToken, "{}", graphQLUrlPrivate, t)

	json.Indent(&responsePretty, []byte(response), "", "\t")
	log.Println(responsePretty.String())
	responsePretty.Reset()

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Get user pipeline permissions 200 status code")

	// -------- Get User single pipeline permissions -------------
	log.Println("📢 - Get User single pipeline permissions")

	query = `query {
		userSinglePipelinePermissions(
			userID: "` + userId + `",
			environmentID: "` + envID + `",
			pipelineID: "` + p.PipelineID + `",
			){
				Access
				Subject
				SubjectID
				PipelineName
				ResourceID
				EnvironmentID
				Active
				Level
				Label
				FirstName
				LastName
				Email
				JobTitle
			}
		}`

	response, httpResponse = testutils.GraphQLRequestPrivate(query, accessToken, "{}", graphQLUrlPrivate, t)

	json.Indent(&responsePretty, []byte(response), "", "\t")
	log.Println(responsePretty.String())
	responsePretty.Reset()

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Get user single pipeline permissions 200 status code")

	// -------- Create Access Group  -------------
	log.Println("📢 - Create Access Group")

	mutation = `mutation {
	createAccessGroup(
		environmentID: "` + envID + `",
		name: "access-group-` + uuid.NewString() + `",
		description: "description",
	)
}`

	response, httpResponse = testutils.GraphQLRequestPrivate(mutation, accessToken, "{}", graphQLUrlPrivate, t)
	accessgroup := jsoniter.Get(response, "data", "createAccessGroup").ToString()

	log.Println(string(response))

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Create access group environments 200 status code")

	// -------- Set pipeline permissions to access group -------------
	log.Println("📢 - Set pipeline permissions to access group")

	mutation = `mutation {
		pipelinePermissionsToAccessGroup(
	environmentID: "` + envID + `",
	resourceID: "` + p.PipelineID + `",
	access_group_id: "` + accessgroup + `",
	access: ["read", "write", "run"]
	)
	}`

	response, httpResponse = testutils.GraphQLRequestPrivate(mutation, accessToken, "{}", graphQLUrlPrivate, t)

	json.Indent(&responsePretty, []byte(response), "", "\t")
	log.Println(responsePretty.String())
	responsePretty.Reset()

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Pipeline permissions to access group 200 status code")

	// -------- Get Pipeline permissions -------------
	log.Println("📢 - Get Pipeline permissions")

	query = `query {
		pipelinePermissions(
				userID: "` + userId + `",
				environmentID: "` + envID + `",
				pipelineID: "` + p.PipelineID + `",
				){
					Access
					Subject
					SubjectID
					PipelineName
					ResourceID
					EnvironmentID
					Active
					Level
					Label
					FirstName
					LastName
					Email
					JobTitle
				}
			}`

	response, httpResponse = testutils.GraphQLRequestPrivate(query, accessToken, "{}", graphQLUrlPrivate, t)

	json.Indent(&responsePretty, []byte(response), "", "\t")
	log.Println(responsePretty.String())
	responsePretty.Reset()

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Get pipeline permissions 200 status code")

	// -------- Remove pipeline permissions to user -------------
	log.Println("📢 - Remove pipeline permissions to user")

	mutation = `mutation {
		pipelinePermissionsToUser(
			environmentID: "` + envID + `",
			resourceID: "` + p.PipelineID + `",
			user_id: "` + userId + `",
			access: []
			)
		}`

	response, httpResponse = testutils.GraphQLRequestPrivate(mutation, accessToken, "{}", graphQLUrlPrivate, t)

	json.Indent(&responsePretty, []byte(response), "", "\t")
	log.Println(responsePretty.String())
	responsePretty.Reset()

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Remove pipeline permissions from user 200 status code")

	// -------- Remove pipeline permissions from access group -------------
	log.Println("📢 - Remove pipeline permissions from access group")

	mutation = `mutation {
		pipelinePermissionsToAccessGroup(
	environmentID: "` + envID + `",
	resourceID: "` + p.PipelineID + `",
	access_group_id: "` + accessgroup + `",
	access: ["read", "write", "run"]
	)
	}`

	response, httpResponse = testutils.GraphQLRequestPrivate(mutation, accessToken, "{}", graphQLUrlPrivate, t)

	json.Indent(&responsePretty, []byte(response), "", "\t")
	log.Println(responsePretty.String())
	responsePretty.Reset()

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Remove pipeline permissions from access group 200 status code")

	// ------ Delete temporary access group
	log.Println("📢 - Delete temporary access group")

	ag := models.PermissionsAccessGroups{}

	err = database.DBConn.Where("access_group_id = ?", accessgroup).Delete(&ag).Error

	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		log.Println(errors.New("Retrive pipelines database error."))
	}

	log.Println("Access group deleted")

}
