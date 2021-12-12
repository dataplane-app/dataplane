package testutils

import "github.com/gofiber/fiber/v2"

var AdminUser string = "admin@email.com"
var AdminPassword string = "Hello123!"
var DbInstance string
var TestEnvironment string = "Staging_test"
var TestUser string = "Test@UserName.com"
var TestPlatformID string
var App *fiber.App
