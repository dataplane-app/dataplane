package pipelinetests

import (
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
go test -p 1 -v -count=1 -run TestPipelines github.com/dataplane-app/dataplane/app/mainapp/Tests/pipelines
* Login
* Create pipeline
* Get pipeline
* Get pipelines
* Add pipeline flow
* Update pipeline flow
* Get pipeline flow
* Get node
* Delete pipeline flow
* Turn off pipeline
* Delete pipeline
*/
func TestPipelines(t *testing.T) {

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

	envID := testutils.TestEnvironmentID
	if testutils.TestEnvironmentID == "" {
		envID = "test-environment-id"
	}

	pipelineName := testutils.TextEscape(faker.UUIDHyphenated())

	// -------- clean data -------
	database.DBConn.Where("environment_id =?", envID).Delete(&models.PipelineNodes{})
	database.DBConn.Where("environment_id =?", envID).Delete(&models.PipelineEdges{})
	database.DBConn.Where("environment_id =?", envID).Delete(&models.Pipelines{})
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
					name: "Name",
					nodeType: "type",
					nodeTypeDesc: "nodeTypeDesc",
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
					name: "Name",
					nodeType: "type",
					nodeTypeDesc: "nodeTypeDesc",
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

	// -------- Update pipeline flow -------------
	mutation = `mutation {
		addUpdatePipelineFlow(
			environmentID: "` + envID + `",
			pipelineID: "` + pipelineId + `",
			input:{
				nodesInput: [{
					nodeID: "nodeID",
					name: "Name2",
					nodeType: "trigger",
					description: "desc",
					commands: [""],
					nodeTypeDesc: "schedule",
					triggerOnline: true,
					workerGroup: "",
					meta: {
					  position: {
						x: 75,
						y: 315
					  },
					  data: {
						language: "Bash",
						genericdata: {
							schedule: "*/1 * * * * *",
							scheduleType: "cronseconds",
							timezone: "Europe/London"
						}
					  }
					},
					active: false
				  },
				  {
					nodeID: "nodeID2",
					name: "Name2",
					nodeType: "process",
					description: "desc",
					commands: [""],
					nodeTypeDesc: "python",
					triggerOnline: true,
					workerGroup: "",
					meta: {
					  position: {
						x: 75,
						y: 315
					  },
					  data: {
						language: "Bash",
						genericdata: {
							schedule: "*/1 * * * * *",
							scheduleType: "cronseconds",
							timezone: "Europe/London"
						}
					  }
					},
					active: false
				  }
				  ],
				  edgesInput: [{
					edgeID: "edgeID",
					from: "from2",
					to: "to2",
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

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Update pipeline 200 status code")

	// -------- Get pipeline flow -------------

	query = `query {
		getPipelineFlow(
			environmentID: "` + envID + `",
			pipelineID: "` + pipelineId + `",
			){
				edges {
					edgeID
					pipelineID
					from
					to
					environmentID
					active
					meta
				}
				nodes {
					nodeID
					pipelineID
					name
					environmentID
					nodeType
					nodeTypeDesc
					workerGroup
					description
					active
					meta
				}
			}
		}`

	response, httpResponse = testutils.GraphQLRequestPrivate(query, accessToken, "{}", graphQLUrlPrivate, t)

	log.Println(string(response))

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Get pipeline flow 200 status code")

	// -------- Get node -------------
	query = `query {
		getNode(
			environmentID: "` + envID + `",
			pipelineID: "test_` + pipelineId + `",
			nodeID: "nodeID",
			){
				nodeID
				pipelineID
				name
				environmentID
				nodeType
				nodeTypeDesc
				workerGroup
				description
				active
				meta
			}
		}`

	response, httpResponse = testutils.GraphQLRequestPrivate(query, accessToken, "{}", graphQLUrlPrivate, t)

	log.Println(string(response))

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Get node 200 status code")

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

	// -------- Turn off pipeline -------------
	mutation = `mutation {
		turnOnOffPipeline(
				environmentID: "` + envID + `",
				online: false,
				pipelineID: "` + pipelineId + `")
				  
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
				pipelineID: "` + pipelineId + `")
				  
			}`

	response, httpResponse = testutils.GraphQLRequestPrivate(mutation, accessToken, "{}", graphQLUrlPrivate, t)

	log.Println(string(response))

	if strings.Contains(string(response), `"errors":`) {
		t.Errorf("Error in graphql response")
	}

	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Delete pipeline 200 status code")
}
