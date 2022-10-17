package auth

import (
	"net/http"

	dpconfig "github.com/dataplane-app/dataplane/app/mainapp/config"
	"github.com/dataplane-app/dataplane/app/mainapp/database"
	"github.com/dataplane-app/dataplane/app/mainapp/database/models"
	"github.com/dataplane-app/dataplane/app/mainapp/logging"

	"github.com/gofiber/fiber/v2"
	"golang.org/x/crypto/bcrypt"
)

func ApiAuthMiddle(publicOrPrivate string) func(*fiber.Ctx) error {
	return func(c *fiber.Ctx) error {

		key := string(c.Request().Header.Peek("apikey"))
		triggerID := string(c.Params("id"))
		version := string(c.Params("version"))

		// If pipeline
		if version == "" {

			// Get trigger info
			trigger := models.PipelineApiTriggers{}

			err := database.DBConn.Where("trigger_id = ?", triggerID).First(&trigger).Error
			if err != nil {
				if dpconfig.Debug == "true" {
					logging.PrintSecretsRedact(err)
				}
				return c.Status(fiber.StatusForbidden).SendString("Retrive pipeline trigger database error.")
			}

			if publicOrPrivate == "public" {
				if trigger.PublicLive == false {
					return c.Status(http.StatusUnauthorized).JSON(fiber.Map{
						"Data Platform": "Dataplane",
						"Error":         "Endpoint is offline",
					})
				}
			}

			if publicOrPrivate == "private" {
				if trigger.PrivateLive == false {
					return c.Status(http.StatusUnauthorized).JSON(fiber.Map{
						"Data Platform": "Dataplane",
						"Error":         "Endpoint is offline",
					})
				}
			}

			if trigger.APIKeyActive == true {
				keys := []models.PipelineApiKeys{}

				err := database.DBConn.Where("trigger_id = ? and (expires_at > now() or expires_at is NULL)", triggerID).Find(&keys).Error
				if err != nil {
					if dpconfig.Debug == "true" {
						logging.PrintSecretsRedact(err)
					}
					return c.Status(fiber.StatusForbidden).SendString("Retrive pipeline trigger database error.")
				}

				// If no keys are found
				if len(keys) == 0 {
					return c.Status(http.StatusUnauthorized).JSON(fiber.Map{
						"Data Platform": "Dataplane",
						"Error":         "Unauthorized",
					})
				}

				// Look for a match in all keys
				for i, v := range keys {
					if err := bcrypt.CompareHashAndPassword([]byte(v.APIKey), []byte(key)); err != nil {

						// Check if the last hash, if not, ignore the error and continue to check the next in line for a match
						if i < len(keys)-1 {
							continue
						}

						return c.Status(http.StatusUnauthorized).JSON(fiber.Map{
							"Data Platform": "Dataplane",
							"Error":         "Unauthorized",
						})
					}

					// Break out of loop when a match is found
					break
				}

			}

			// --- Pass through context
			c.Locals("environmentID", trigger.EnvironmentID)
			c.Locals("pipelineID", trigger.PipelineID)
		}

		// If deployment
		if version != "" {

			// Get trigger info
			trigger := models.DeploymentApiTriggers{}

			err := database.DBConn.Where("trigger_id = ?", triggerID).First(&trigger).Error
			if err != nil {
				if dpconfig.Debug == "true" {
					logging.PrintSecretsRedact(err)
				}
				return c.Status(fiber.StatusForbidden).SendString("Retrive pipeline trigger database error.")
			}

			if publicOrPrivate == "public" {
				if trigger.PublicLive == false {
					return c.Status(http.StatusUnauthorized).JSON(fiber.Map{
						"Data Platform": "Dataplane",
						"Error":         "Endpoint is offline",
					})
				}
			}

			if publicOrPrivate == "private" {
				if trigger.PrivateLive == false {
					return c.Status(http.StatusUnauthorized).JSON(fiber.Map{
						"Data Platform": "Dataplane",
						"Error":         "Endpoint is offline",
					})
				}
			}

			if trigger.APIKeyActive == true {
				keys := []models.DeploymentApiKeys{}

				err := database.DBConn.Where("trigger_id = ? and (expires_at > now() or expires_at is NULL)", triggerID).Find(&keys).Error
				if err != nil {
					if dpconfig.Debug == "true" {
						logging.PrintSecretsRedact(err)
					}
					return c.Status(fiber.StatusForbidden).SendString("Retrive pipeline trigger database error.")
				}

				// If no keys are found
				if len(keys) == 0 {
					return c.Status(http.StatusUnauthorized).JSON(fiber.Map{
						"Data Platform": "Dataplane",
						"Error":         "Unauthorized",
					})
				}

				// Look for a match in all keys
				for i, v := range keys {
					if err := bcrypt.CompareHashAndPassword([]byte(v.APIKey), []byte(key)); err != nil {

						// Check if the last hash, if not, ignore the error and continue to check the next in line for a match
						if i < len(keys)-1 {
							continue
						}

						return c.Status(http.StatusUnauthorized).JSON(fiber.Map{
							"Data Platform": "Dataplane",
							"Error":         "Unauthorized",
						})
					}

					// Break out of loop when a match is found
					break
				}

			}

			// --- Pass through context
			c.Locals("environmentID", trigger.EnvironmentID)
			c.Locals("deploymentID", trigger.DeploymentID)
		}

		return c.Next()
	}
}
