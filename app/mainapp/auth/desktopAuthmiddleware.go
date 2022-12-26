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
		workerID := string(c.Request().Header.Peek("workerID"))
		if len(authHeader) != 2 {
			errstring := "Malformed token"
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"r": "error", "msg": errstring, "active": false})
		}

		// TODO: Add authentication
		log.Printf("Session key: %v\n", authHeader[1])
		log.Printf("workerID: %v\n", workerID)

		// // 2. Check session against redis
		// val, err := database.RedisConn.Get(ctx, "sess-"+remoteWorkerID).Result()
		// if err != nil {
		// 	log.Println("Remote worker redis get connect error:", err)
		// 	return c.Status(http.StatusUnauthorized).JSON(fiber.Map{
		// 		"r": "Unauthorized - error getting session",
		// 	})
		// }

		// // log.Println(val, sessionID)

		// if val != sessionID {
		// 	log.Println("Remote worker session mismatch:")
		// 	return c.Status(http.StatusUnauthorized).JSON(fiber.Map{
		// 		"r": "Unauthorized - session doesn't exist or expired",
		// 	})
		// }

		// // --- Pass through context
		// c.Locals("remoteWorkerID", remoteWorkerID)
		// c.Locals("sessionID", sessionID)
		// c.Locals("request", request)

		// access, claims := ValidateAccessToken(authHeader[1])

		// if access == false {
		// 	return c.Status(http.StatusUnauthorized).JSON(fiber.Map{
		// 		"r": "Unauthorized",
		// 	})

		// }

		return c.Next()
	}
}
