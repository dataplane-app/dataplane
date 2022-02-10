package pipelinetests

/*
For individual tests - in separate window run: go run server.go
go test -p 1 -v -count=1 -run TestAccessGroups dataplane/Tests/pipelines
* Login
* Create pipeline
*/
// func TestAccessGroups(t *testing.T) {

// 	database.DBConnect()

// 	graphQLUrl := "http://localhost:9000/public/graphql"
// 	graphQLUrlPrivate := "http://localhost:9000/private/graphql"

// 	testUser := testutils.AdminUser
// 	testPassword := testutils.AdminPassword

// 	//--------- Login ------------

// 	loginUser := `{
// 		loginUser(
// 		  username: "` + testUser + `",
// 		  password: "` + testPassword + `",
// 		) {
// 		  access_token
// 		  refresh_token
// 		}
// 	  }`

// 	loginUserResponse, httpLoginResponse := testutils.GraphQLRequestPublic(loginUser, "{}", graphQLUrl, t)
// 	accessToken := jsoniter.Get(loginUserResponse, "data", "loginUser", "access_token").ToString()

// 	log.Println(string(loginUserResponse))

// 	if strings.Contains(string(loginUserResponse), `"errors":`) {
// 		t.Errorf("Error in graphql response")
// 	}

// 	assert.Equalf(t, http.StatusOK, httpLoginResponse.StatusCode, "Login user 200 status code")

// 	// -------- Create pipeline -------------

// 	mutation := `mutation {
// 		addPipeline(
// 			name: "Test_Pipeline",
// 			description: "Test"
// 			)
// 		}`

// 	response, httpResponse := testutils.GraphQLRequestPrivate(mutation, accessToken, "{}", graphQLUrlPrivate, t)

// 	log.Println(string(response))

// 	if strings.Contains(string(response), `"errors":`) {
// 		t.Errorf("Error in graphql response")
// 	}

// 	assert.Equalf(t, http.StatusOK, httpResponse.StatusCode, "Create pipeline 200 status code")

// }
