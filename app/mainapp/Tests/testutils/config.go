package testutils

import "github.com/gofiber/fiber/v2"

var AdminUser string = "admin@email.com"
var AdminPassword string = "Hello123!"
var DbInstance string
var TestEnvironment string = "Staging_test"
var TestEnvironmentID string = ""
var TestUser string = "Test@UserName.com"
var TestPlatformID string
var App *fiber.App

var GraphQLUrlPublic string = "http://localhost:9000/app/public/graphql"
var GraphQLUrlPrivate string = "http://localhost:9000/app/private/graphql"
var RefreshTokenUrl string = "http://localhost:9000/app/refreshtoken"
var APIPipelineTriggerPPublic string = "http://localhost:9000/publicapi/api-trigger"
var APIDeploymentTriggerPPublic string = "http://localhost:9000/publicapi/deployment/api-trigger"
var JWTToken []byte
