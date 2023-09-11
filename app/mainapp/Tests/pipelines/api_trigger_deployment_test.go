package pipelinetests

import (
	"bytes"
	"io/ioutil"
	"log"
	"net/http"
	"strings"
	"testing"

	"github.com/dataplane-app/dataplane/app/mainapp/Tests/testutils"
	"github.com/dataplane-app/dataplane/app/mainapp/database"
	"github.com/dataplane-app/dataplane/app/mainapp/database/models"

	"github.com/bxcodec/faker/v3"
	jsoniter "github.com/json-iterator/go"
	"github.com/stretchr/testify/assert"
)

/*
For individual tests - in separate window run: go run server.go
go test -p 1 -v -count=1 -run TestApiTriggerDeployments github.com/dataplane-app/dataplane/app/mainapp/Tests/pipelines
* Login
* Create pipeline
* Get pipeline
* Get pipelines
* Add pipeline flow
* Add deployment
* Generate Deployment trigger
* Add API key
* Get API keys
* Get Deployment trigger
* Run deployment API trigger
* Delete API key
*/
func TestApiTriggerDeployments(t *testing.T) {

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

	devEnv := models.Environment{}
	database.DBConn.Where("name = ?", "Development").First(&devEnv)
	envID := devEnv.ID

	pipelineName := testutils.TextEscape(faker.UUIDHyphenated())

	// -------- clean data -------
	database.DBConn.Where("environment_id =?", envID).Delete(&models.PipelineNodes{})
	database.DBConn.Where("environment_id =?", envID).Delete(&models.PipelineEdges{})
	database.DBConn.Where("environment_id =?", envID).Delete(&models.Pipelines{})

	database.DBConn.Where("environment_id =?", envID).Delete(&models.DeployPipelineNodes{})
	database.DBConn.Where("environment_id =?", envID).Delete(&models.DeployPipelineEdges{})
	database.DBConn.Where("environment_id =?", envID).Delete(&models.DeployPipelines{})
	database.DBConn.Where("environment_id =?", envID).Delete(&models.DeploymentApiTriggers{})
	// -------- Create pipeline -------------

	mutation := `mutation {
		addPipeline(
			name: "test_` + pipelineName + `",
			environmentID: "` + envID + `",
			description: "Test",
			workerGroup: "python_1"
			)
		}`

	response, httpResponse := testutils.GraphQLRequestPrivate(mutation, accessToken, "{}", graphQLUrlPrivate, t)

	log.Println(string(response))

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Create pipeline 200 status code")

	// -------- Update pipeline -------------
	pipelineId := jsoniter.Get(response, "data", "addPipeline").ToString()

	log.Println("PIPELINE ID: ", pipelineId, "ENV ID:", envID)

	mutation = `mutation {
		updatePipeline(
				name: "test_` + pipelineName + `",
				pipelineID: "` + pipelineId + `",
				environmentID: "` + envID + `",
				description: "Test new description",
				workerGroup: "python_1"
				)
			}`

	response, httpResponse = testutils.GraphQLRequestPrivate(mutation, accessToken, "{}", graphQLUrlPrivate, t)

	log.Println(string(response))

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Update pipeline 200 status code")

	// -------- Get pipeline -------------

	query := `query {
			getPipeline(
				environmentID: "` + envID + `",
				pipelineID: "` + pipelineId + `"
				){
					pipelineID
					name
					environmentID
					description
					active
					online
					current
				}
			}`

	response, httpResponse = testutils.GraphQLRequestPrivate(query, accessToken, "{}", graphQLUrlPrivate, t)

	log.Println(string(response))

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Get pipelines 200 status code")

	// -------- Get pipelines -------------

	query = `query {
		getPipelines(
			environmentID: "` + envID + `",
			){
				pipelineID
				name
				environmentID
				description
				active
				online
				current
			}
		}`

	response, httpResponse = testutils.GraphQLRequestPrivate(query, accessToken, "{}", graphQLUrlPrivate, t)

	log.Println(string(response))

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Get pipelines 200 status code")

	// -------- Add pipeline flow -------------
	mutation = `mutation {
		addUpdatePipelineFlow(
			environmentID: "` + envID + `",
			pipelineID: "` + pipelineId + `",
			input:{
				nodesInput: [{
					nodeID: "nodeID",
					name: "Api Trigger",
					nodeType: "trigger",
					nodeTypeDesc: "api",
					triggerOnline: true,
					description: "desc",
					commands: [""],
					workerGroup: "python_1",
					meta: {
					  position: {
						x: 75,
						y: 315
					  },
					  data: {
						language: "Bash",
						genericdata: null
					  }
					},
					active: false
				  },
				  {
					nodeID: "nodeID2",
					name: "Python",
					nodeType: "process",
					nodeTypeDesc: "python",
					triggerOnline: true,
					description: "desc",
					commands: [""],
					workerGroup: "python_1",
					meta: {
					  position: {
						x: 75,
						y: 315
					  },
					  data: {
						language: "Bash",
						genericdata: null
					  }
					},
					active: false
				  }
				  ],
				  edgesInput: [{
					edgeID: "edgeID",
					from: "from",
					to: "to",
					meta: {
					  sourceHandle: "sourceHandle",
					  targetHandle: "targetHandle",
					  edgeType: "custom",
					  arrowHeadType: "arrowHeadType"
					},
					active: false
				  }],
				  json: {
					position: {
						x: 75,
						y: 315
					},
					data: {
						language: "Bash"
					}
				}
				}
			)
      		
		}`

	response, httpResponse = testutils.GraphQLRequestPrivate(mutation, accessToken, "{}", graphQLUrlPrivate, t)

	log.Println(string(response))

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Add pipeline flow 200 status code")

	// -------- Add deployment -------------
	mutation = `mutation { 
		addDeployment(
		  pipelineID: "` + pipelineId + `", 
		  fromEnvironmentID: "` + envID + `", 
		  toEnvironmentID: "` + envID + `", 
		  version: "0.0.22", 
		  workerGroup: "python_1",
		  liveactive: true)
	}`

	response, httpResponse = testutils.GraphQLRequestPrivate(mutation, accessToken, "{}", graphQLUrlPrivate, t)
	log.Println(string(response))

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Add deployment 200 status code")

	// -------- Generate Deployment trigger -------------
	mutation = `mutation { 
		generateDeploymentTrigger(
		  deploymentID: "d-` + pipelineId + `", 
		  environmentID: "` + envID + `", 
		  triggerID: "triggerID", 
		  apiKeyActive: true, 
		  publicLive: true,
		  privateLive: true, 
		  dataSizeLimit: 5,
		  dataTTL: 86400)
	}`

	response, httpResponse = testutils.GraphQLRequestPrivate(mutation, accessToken, "{}", graphQLUrlPrivate, t)
	log.Println(string(response))

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Generate deployment trigger 200 status code")

	// -------- Add API key -------------
	mutation = `mutation { 
		addDeploymentApiKey(
		  deploymentID: "d-` + pipelineId + `", 
		  environmentID: "` + envID + `", 
		  triggerID: "triggerID", 
		  apiKey: "0-0-0-apiKey", 
		  expiresAt: null)
	}`

	response, httpResponse = testutils.GraphQLRequestPrivate(mutation, accessToken, "{}", graphQLUrlPrivate, t)
	log.Println(string(response))

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Add API key 200 status code")

	// -------- Get API keys -------------
	query = `query { 
		getDeploymentApiKeys(
			  deploymentID: "d-` + pipelineId + `", 
			  environmentID: "` + envID + `"
			  ){
				triggerID
				apiKey
				apiKeyTail
				deploymentID
				environmentID
				expiresAt
			  }
		}`

	response, httpResponse = testutils.GraphQLRequestPrivate(query, accessToken, "{}", graphQLUrlPrivate, t)
	log.Println(string(response))

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	encryptedKey := jsoniter.Get(response, "data", "getDeploymentApiKeys", 0, "apiKey").ToString()

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Get API keys 200 status code")

	// -------- Get Deployment trigger -------------
	query = `query { 
		getDeploymentTrigger(
		  deploymentID: "d-` + pipelineId + `", 
		  environmentID: "` + envID + `"
		  ){
			triggerID
			deploymentID
			environmentID
			apiKeyActive
			publicLive
			privateLive
		  }
	}`

	response, httpResponse = testutils.GraphQLRequestPrivate(query, accessToken, "{}", graphQLUrlPrivate, t)
	log.Println(string(response))

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Get Deployment trigger 200 status code")

	// -------- Run deployment API trigger -------------
	client := &http.Client{}
	data := `{}`
	url := testutils.APIDeploymentTriggerPPublic + "/latest/triggerID"

	req, err := http.NewRequest("POST", url, bytes.NewBuffer([]byte(data)))
	if err != nil {
		t.Error(err)
	}

	req.Header.Add("Content-Type", "application/json")
	req.Header.Add("apiKey", "0-0-0-apiKey")

	res, err := client.Do(req)
	if err != nil {
		t.Error(err)
	}

	defer res.Body.Close()

	responseBody, err := ioutil.ReadAll(res.Body)
	if err != nil {
		t.Error(err)
	}

	log.Println(string(responseBody))

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in API response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Run deployment API trigger 200 status code")

	// -------- Delete API key -------------
	mutation = `mutation { 
		deleteDeploymentApiKey(
			  deploymentID: "d-` + pipelineId + `", 
			  environmentID: "` + envID + `",
			  apiKey: "` + encryptedKey + `")
		}`

	response, httpResponse = testutils.GraphQLRequestPrivate(mutation, accessToken, "{}", graphQLUrlPrivate, t)
	log.Println(string(response))

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Delete API key 200 status code")

}
