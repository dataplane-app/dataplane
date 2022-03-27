package pipelinetests

import (
	"dataplane/mainapp/Tests/testutils"
	"dataplane/mainapp/database"
	"dataplane/mainapp/database/models"
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
go test -p 1 -v -count=1 -run TestPipelines dataplane/mainapp/Tests/codefiles
* Login
* Create pipeline
* Add pipeline flow

* Create folder node -
* Upload file node   - 	WIP

* Delete pipeline flow
* Delete pipeline

*/
func TestCodeFiles(t *testing.T) {

	database.DBConnect()

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

	loginUserResponse, httpLoginResponse := testutils.GraphQLRequestPublic(loginUser, "{}", graphQLUrl, t)
	accessToken := jsoniter.Get(loginUserResponse, "data", "loginUser", "access_token").ToString()

	// log.Println(string(loginUserResponse))

	if strings.Contains(string(loginUserResponse), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpLoginResponse.StatusCode, "Login user 200 status code")

	// envID := testutils.TestEnvironmentID
	// if testutils.TestEnvironmentID == "" {
	// 	envID = "test-environment-id"
	// }

	pipelineId := testutils.TextEscape(faker.UUIDHyphenated())

	// -------- clean data -------
	// database.DBConn.Where("environment_id =?", envID).Delete(&models.PipelineNodes{})
	// database.DBConn.Where("environment_id =?", envID).Delete(&models.PipelineEdges{})
	// database.DBConn.Where("environment_id =?", envID).Delete(&models.Pipelines{})
	database.DBConn.Where("name =?", "test_Code_Files_Environment").Delete(&models.Environment{})
	// -------- Add environment -------------

	mutation := `mutation {
		addEnvironment(
			input: {
				name: "test_Code_Files_Environment",
				description: ""
			}
				){
					id
					name
					description
				}
			}`

	response, httpResponse := testutils.GraphQLRequestPrivate(mutation, accessToken, "{}", graphQLUrlPrivate, t)

	log.Println(string(response))

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Add environment 200 status code")
	envID := jsoniter.Get(response, "data", "addEnvironment", "id").ToString()

	// -------- Create pipeline -------------

	mutation = `mutation {
		addPipeline(
			name: "test_` + pipelineId + `",
			environmentID: "` + envID + `",
			description: "Test",
			workerGroup: "python_1"
			)
		}`

	response, httpResponse = testutils.GraphQLRequestPrivate(mutation, accessToken, "{}", graphQLUrlPrivate, t)

	log.Println(string(response))

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Create pipeline 200 status code")
	id := jsoniter.Get(response, "data", "addPipeline").ToString()

	// -------- Add pipeline flow -------------
	mutation = `mutation {
		addUpdatePipelineFlow(
			environmentID: "` + envID + `",
			pipelineID: "` + id + `",
			input:{
				nodesInput: [{
					nodeID: "nodeID",
					name: "TestNodePython",
					nodeType: "pythonNode",
					nodeTypeDesc: "",
					triggerOnline: false,
					description: "",
					commands: [""],
					workerGroup: "python_1",
					meta: {
					  position: {
						x: 75,
						y: 315
					  },
					  data: {
						language: "Python",
						genericdata: null
					  }
					},
					active: false
				  }
				  ],
				  edgesInput: [],
				  json: {}
				}
			)
      		
		}`

	response, httpResponse = testutils.GraphQLRequestPrivate(mutation, accessToken, "{}", graphQLUrlPrivate, t)

	log.Println(string(response))

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Add pipeline flow 200 status code")

	// -------- Create folder -------------
	// Get parent's folder id
	f := models.CodeFolders{}
	err := database.DBConn.Where("folder_name = ? AND pipeline_id = ?", "TestNodePython", id).Find(&f).Error
	if err != nil {
		t.Errorf(err.Error())
	}

	mutation = `mutation {
		createFolderNode(
			input: {
				folderID: "Folder1-ID",
				parentID: "` + f.FolderID + `",
				environmentID: "` + envID + `",
				pipelineID: "` + id + `",
				nodeID: "nodeID",
				folderName: "Folder1",
				fType: "folder",
				active: true
			}
			){
				folderID
				parentID
				folderName
				level
				fType
				active
			}
		}`

	response, httpResponse = testutils.GraphQLRequestPrivate(mutation, accessToken, "{}", graphQLUrlPrivate, t)

	log.Println(string(response))

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Add folder 200 status code")

	// -------- Create file -------------
	folder1ID := jsoniter.Get(response, "data", "createFolderNode", "folderID").ToString()
	// emptyFile, err := os.Create("emptyFile.txt")

	mutation = `mutation {
		uploadFileNode(
					folderID: "` + folder1ID + `",
					environmentID: "` + envID + `",
					pipelineID: "` + id + `",
					nodeID: "nodeID",
					file: "file"
				)
			}`

	response, httpResponse = testutils.GraphQLRequestPrivate(mutation, accessToken, "{}", graphQLUrlPrivate, t)

	log.Println(string(response))

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Add file 200 status code")

	// -------- Delete pipeline flow -------------
	mutation = `mutation {
		addUpdatePipelineFlow(
			environmentID: "` + envID + `",
			pipelineID: "` + pipelineId + `",
			input:{
				nodesInput: [],
				edgesInput: [],
				json: {}
				}
			)

		}`

	response, httpResponse = testutils.GraphQLRequestPrivate(mutation, accessToken, "{}", graphQLUrlPrivate, t)

	log.Println(string(response))

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Delete pipeline 200 status code")

	// -------- Delete pipeline -------------

	mutation = `mutation {
		deletePipeline(
				environmentID: "` + envID + `",
				pipelineID: "` + id + `")

			}`

	response, httpResponse = testutils.GraphQLRequestPrivate(mutation, accessToken, "{}", graphQLUrlPrivate, t)

	log.Println(string(response))

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Delete pipeline 200 status code")
}
