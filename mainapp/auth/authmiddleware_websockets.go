package auth

import (
	"net/http"

	"github.com/gofiber/fiber/v2"
)

func TokenAuthMiddleWebsockets() func(*fiber.Ctx) error {
	return func(c *fiber.Ctx) error {

		authHeader := string(c.Query("token"))
		// if len(authHeader) != 2 {
		// 	errstring := "Malformed token"
		// 	return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"r": "error", "msg": errstring, "active": false})
		// }

		// log.Println(c.Params("token"))

		access, claims := ValidateAccessToken(authHeader)

		if access == false {
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{
				"r": "Unauthorized",
			})

		}

		// --- Pass through context
		c.Locals("currentUser", claims.Subject)
		c.Locals("currentUserType", claims.UserType)
		c.Locals("platformID", claims.PlatformID)

		return c.Next()
	}
}
