package auth

import (
	"log"
	"net/http"
	"strings"

	"github.com/gofiber/fiber/v2"
)

func DesktopAuthMiddle() func(*fiber.Ctx) error {
	return func(c *fiber.Ctx) error {

		authHeader := strings.Split(string(c.Request().Header.Peek("Authorization")), "Bearer ")
		if len(authHeader) != 2 {
			errstring := "Malformed token"
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"r": "error", "msg": errstring, "active": false})
		}

		// TODO: Add authentication
		log.Printf("Session key: %v\n", authHeader[1])

		// access, claims := ValidateAccessToken(authHeader[1])

		// if access == false {
		// 	return c.Status(http.StatusUnauthorized).JSON(fiber.Map{
		// 		"r": "Unauthorized",
		// 	})

		// }

		return c.Next()
	}
}
