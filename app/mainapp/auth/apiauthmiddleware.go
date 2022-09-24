package auth

import (
	dpconfig "dataplane/mainapp/config"
	"dataplane/mainapp/database"
	"dataplane/mainapp/database/models"
	"dataplane/mainapp/logging"
	"net/http"

	"github.com/gofiber/fiber/v2"
	"golang.org/x/crypto/bcrypt"
)

func ApiAuthMiddle() func(*fiber.Ctx) error {
	return func(c *fiber.Ctx) error {

		triggerID := string(c.Params("id"))
		key := string(c.Request().Header.Peek("apikey"))

		// Get trigger info
		trigger := models.PipelineApiTriggers{}

		err := database.DBConn.Where("trigger_id = ?", triggerID).First(&trigger).Error
		if err != nil {
			if dpconfig.Debug == "true" {
				logging.PrintSecretsRedact(err)
			}
			return c.Status(fiber.StatusForbidden).SendString("Retrive pipeline trigger database error.")
		}

		if trigger.APIKeyActive == true {
			keys := []models.PipelineApiKeys{}

			err := database.DBConn.Where("trigger_id = ?", triggerID).Find(&keys).Error
			if err != nil {
				if dpconfig.Debug == "true" {
					logging.PrintSecretsRedact(err)
				}
				return c.Status(fiber.StatusForbidden).SendString("Retrive pipeline trigger database error.")
			}

			// Look for a match in all keys
			for i, v := range keys {
				if err := bcrypt.CompareHashAndPassword([]byte(v.APIKey), []byte(key)); err != nil {

					// Check if the last hash, if not, ignore the error and continue to check the next in line for a match
					if i < len(keys)-1 {
						continue
					}

					return c.Status(http.StatusUnauthorized).JSON(fiber.Map{
						"r": "Unauthorized",
					})
				}

				// Break out of loop when a match is found
				break
			}

		}

		// --- Pass through context
		c.Locals("environmentID", trigger.EnvironmentID)
		c.Locals("pipelineID", trigger.PipelineID)
		return c.Next()
	}
}
