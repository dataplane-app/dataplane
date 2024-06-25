package routes

import (
	dpconfig "github.com/dataplane-app/dataplane/app/mainapp/config"
	"github.com/gofiber/fiber/v2"
)

func APIRoutes(app *fiber.App) {

	// ------- OPEN ROUTES ------
	public := app.Group("/app/public/api")

	public.Post("/authstrategy", func(c *fiber.Ctx) error {
		return c.JSON(&fiber.Map{"authstrategy": dpconfig.AuthStrategy})

	})
}
