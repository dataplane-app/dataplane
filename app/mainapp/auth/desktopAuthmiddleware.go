package auth

import (
	"context"
	"log"
	"net/http"
	"strings"

	"github.com/dataplane-app/dataplane/app/mainapp/database"
	"github.com/gofiber/fiber/v2"
)

func DesktopAuthMiddle() func(*fiber.Ctx) error {
	return func(c *fiber.Ctx) error {

		ctx := context.Background()

		authHeader := strings.Split(string(c.Request().Header.Peek("Authorization")), "Bearer ")
		remoteWorkerID := string(c.Request().Header.Peek("workerID"))
		if len(authHeader) != 2 {
			errstring := "Malformed token"
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"r": "error", "msg": errstring, "active": false})
		}

		// TODO: Add authentication
		// log.Printf("Session key: %v\n", authHeader[1])
		// log.Printf("workerID: %v\n", remoteWorkerID)

		// 2. Check session against redis
		val, err := database.RedisConn.Get(ctx, "sess-"+remoteWorkerID).Result()
		if err != nil {
			log.Println("Remote worker redis get connect error:", err)
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{
				"r": "Unauthorized - error getting session",
			})
		}

		// log.Println("Match tokens: ", val, authHeader[1])

		if val != authHeader[1] {
			log.Println("Remote worker session mismatch:")
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{
				"r": "Unauthorized - session doesn't exist or expired",
			})
		}

		return c.Next()
	}
}
