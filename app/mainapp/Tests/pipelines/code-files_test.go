package pipelinetests

import (
	"dataplane/mainapp/Tests/testutils"
	"dataplane/mainapp/code_editor/filesystem"
	"dataplane/mainapp/config"
	"dataplane/mainapp/database"
	"dataplane/mainapp/database/models"
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
For individual tests - in separate window run: go run server.go
go test -p 1 -v -count=1 -run TestPipelines dataplane/mainapp/Tests/codefiles
* Login
* Create pipeline
* Add pipeline flow

* Create folder 2
* Create folder 1
* Rename folder
* Upload file
* Move file
* Rename file
* Get Files node
* Delete file
* Delete folder

* Delete pipeline flow
* Delete pipeline
* Delete environment
* Delete temoprary environment folder

*/
func TestCodeFiles(t *testing.T) {
	config.LoadConfig()
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

	// Get environment folder path
	f := models.CodeFolders{}
	err := database.DBConn.Where("pipeline_id = ? and level = ?", id, "pipeline").Find(&f).Error
	if err != nil {
		t.Errorf(err.Error())
	}
	folderpath, _ := filesystem.FolderConstructByID(database.DBConn, f.ParentID, envID, "")
	deleteFolder := config.CodeDirectory + folderpath

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
	err = database.DBConn.Where("folder_name = ? AND pipeline_id = ?", "TestNodePython", id).Find(&f).Error
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
				folderName: "Folder2",
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
	Folder2ID := jsoniter.Get(response, "data", "createFolderNode", "folderID").ToString()

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Add folder 200 status code")

	// -------- Create folder -------------
	// Get parent's folder id
	err = database.DBConn.Where("folder_name = ? AND pipeline_id = ?", "TestNodePython", id).Find(&f).Error
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
				folderName: "Folder",
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
	renamedFolderID := jsoniter.Get(response, "data", "createFolderNode", "folderID").ToString()

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Add folder 200 status code")

	// -------- Rename folder -------------
	mutation = `mutation {
		renameFolder(
						folderID: "` + renamedFolderID + `",
						environmentID: "` + envID + `",
						pipelineID: "` + id + `",
						nodeID: "nodeID",
						newName: "Folder1"
					)
				}`

	response, httpResponse = testutils.GraphQLRequestPrivate(mutation, accessToken, "{}", graphQLUrlPrivate, t)

	log.Println(string(response))

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Rename folder 200 status code")

	// -------- Move folder -------------
	mutation = `mutation {
			moveFolderNode(
							folderID: "` + renamedFolderID + `",
							environmentID: "` + envID + `",
							pipelineID: "` + id + `",
							toFolderID: "` + Folder2ID + `"
						)
					}`

	response, httpResponse = testutils.GraphQLRequestPrivate(mutation, accessToken, "{}", graphQLUrlPrivate, t)

	log.Println(string(response))

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Move folder 200 status code")

	// -------- Create file -------------

	mutation = `mutation {
		uploadFileNode(
					folderID: "` + renamedFolderID + `",
					environmentID: "` + envID + `",
					pipelineID: "` + id + `",
					nodeID: "nodeID",
					file: "file"
				)
			}`

	response, httpResponse = testutils.GraphQLRequestPrivateUpload(accessToken, graphQLUrlPrivate, renamedFolderID, envID, id, "nodeID", t)

	log.Println(string(response))
	uploadedFileID := jsoniter.Get(response, "data", "uploadFileNode").ToString()

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Add file 200 status code")

	// -------- Move file -------------

	mutation = `mutation {
			moveFileNode(
						fileID: "` + uploadedFileID + `",
						toFolderID: "` + Folder2ID + `",
						environmentID: "` + envID + `",
						pipelineID: "` + id + `"
						
					)
				}`

	response, httpResponse = testutils.GraphQLRequestPrivate(mutation, accessToken, "{}", graphQLUrlPrivate, t)

	log.Println(string(response))

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Add file 200 status code")

	// -------- Rename file -------------
	mutation = `mutation {
			renameFile(
						fileID: "` + uploadedFileID + `",
						environmentID: "` + envID + `",
						pipelineID: "` + id + `",
						nodeID: "nodeID",
						newName: "dp-entrypoint_Renamed.py"
					)
				}`

	response, httpResponse = testutils.GraphQLRequestPrivate(mutation, accessToken, "{}", graphQLUrlPrivate, t)

	log.Println(string(response))

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Rename file 200 status code")

	// -------- Get files node -------------
	mutation = `query {
		filesNode(
				environmentID: "` + envID + `",
				pipelineID: "` + id + `",
				nodeID: "nodeID"
			){
				folders{
					folderID
					parentID
					folderName
					level
					fType
					active
				}
				files{
					fileID
					folderID
					fileName
					level
					fType
					active
				}
			}
		}`

	response, httpResponse = testutils.GraphQLRequestPrivate(mutation, accessToken, "{}", graphQLUrlPrivate, t)

	log.Println(string(response))

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Get files node 200 status code")

	// -------- Delete file -------------
	mutation = `mutation {
		deleteFileNode(
					fileID: "` + uploadedFileID + `",
					environmentID: "` + envID + `",
					pipelineID: "` + id + `",
					nodeID: "nodeID"
				)
			}`

	response, httpResponse = testutils.GraphQLRequestPrivate(mutation, accessToken, "{}", graphQLUrlPrivate, t)

	log.Println(string(response))

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Delete file 200 status code")

	// -------- Delete folder -------------
	mutation = `mutation {
					deleteFolderNode(
							folderID: "` + renamedFolderID + `",
							environmentID: "` + envID + `",
							pipelineID: "` + id + `",
							nodeID: "nodeID"
						)
					}`

	response, httpResponse = testutils.GraphQLRequestPrivate(mutation, accessToken, "{}", graphQLUrlPrivate, t)

	log.Println(string(response))

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Delete folder 200 status code")

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

	// -------- Delete environment -------------
	mutation = `mutation {
		updateDeleteEnvironment(
			environment_id: "` + envID + `")
			}`

	response, httpResponse = testutils.GraphQLRequestPrivate(mutation, accessToken, "{}", graphQLUrlPrivate, t)

	log.Println(string(response))

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Delete environment 200 status code")

	// -------- Remove Temporary environment
	err = os.RemoveAll(deleteFolder)
	if err != nil {
		t.Errorf(err.Error())
	}
}
