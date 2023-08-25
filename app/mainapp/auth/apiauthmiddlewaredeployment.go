package auth

import (
	"errors"
	"net/http"

	dpconfig "github.com/dataplane-app/dataplane/app/mainapp/config"
	"github.com/dataplane-app/dataplane/app/mainapp/database"
	"github.com/dataplane-app/dataplane/app/mainapp/database/models"
	"github.com/dataplane-app/dataplane/app/mainapp/logging"
	"gorm.io/gorm"

	"github.com/gofiber/fiber/v2"
	"golang.org/x/crypto/bcrypt"
)

func ApiAuthMiddleDeployment(publicOrPrivate string) func(*fiber.Ctx) error {
	return func(c *fiber.Ctx) error {

		key := string(c.Request().Header.Peek("apikey"))
		bodyLength := len(c.Body())
		// log.Println(bodyLength)
		triggerID := string(c.Params("id"))

		// Get trigger info
		trigger := models.DeploymentApiTriggers{}

		errauth := database.DBConn.Transaction(func(tx *gorm.DB) error {

			err := tx.Select("api_key_active", "public_live", "private_live", "data_size_limit", "environment_id", "pipeline_id").Where("trigger_id = ?", triggerID).First(&trigger).Error
			if err != nil {
				if dpconfig.Debug == "true" {
					logging.PrintSecretsRedact(err)
				}
				return errors.New("Retrive pipeline trigger database error.")
			}

			if publicOrPrivate == "public" {
				if trigger.PublicLive == false {
					return errors.New("Endpoint offline")
				}
			}

			if publicOrPrivate == "private" {
				if trigger.PrivateLive == false {
					return errors.New("Endpoint offline")
				}
			}

			sizeLimit := trigger.DataSizeLimit * 1024 * 1024

			if bodyLength > int(sizeLimit) {
				return errors.New("Exceeds API body data limit")
			}

			if trigger.APIKeyActive == true {
				keys := []models.DeploymentApiKeys{}

				err := tx.Where("trigger_id = ? and (expires_at > now() or expires_at is NULL)", triggerID).Find(&keys).Error
				if err != nil {
					if dpconfig.Debug == "true" {
						logging.PrintSecretsRedact(err)
					}
					return errors.New("Retrive pipeline trigger database error.")

				}

				// If no keys are found
				if len(keys) == 0 {
					return errors.New("Unauthorized")
				}

				// Look for a match in all keys
				for i, v := range keys {
					if err := bcrypt.CompareHashAndPassword([]byte(v.APISecret), []byte(key)); err != nil {

						// Check if the last hash, if not, ignore the error and continue to check the next in line for a match
						if i < len(keys)-1 {
							continue
						}

						return errors.New("Unauthorized")
					}

					// Break out of loop when a match is found
					break
				}

			}

			return nil
		})

		if errauth != nil {

			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{
				"Data Platform": "Dataplane",
				"Error":         errauth.Error(),
			})

		}

		// --- Pass through context
		c.Locals("environmentID", trigger.EnvironmentID)
		c.Locals("deploymentID", trigger.DeploymentID)

		return c.Next()
	}
}
