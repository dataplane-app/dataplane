package auth

import (
	"net/http"
	"strings"

	"github.com/gofiber/fiber/v2"
)

func TokenAuthMiddle() func(*fiber.Ctx) error {
	return func(c *fiber.Ctx) error {

		authHeader := strings.Split(string(c.Request().Header.Peek("Authorization")), "Bearer ")
		if len(authHeader) != 2 {
			errstring := "Malformed token"
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"r": "error", "msg": errstring, "active": false})
		}

		access, claims := ValidateAccessToken(authHeader[1])

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
