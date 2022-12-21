package auth

import (
	"context"
	"log"
	"net/http"

	"github.com/dataplane-app/dataplane/app/mainapp/database"
	"github.com/gofiber/fiber/v2"
)

func AuthRemoteWorkerWebsockets() func(*fiber.Ctx) error {
	return func(c *fiber.Ctx) error {

		ctx := context.Background()

		var sessionID string

		request := string(c.Params("request"))
		remoteWorkerID := string(c.Params("workerID"))
		sessionID = string(c.Params("sessionID"))

		// 2. Check session against redis
		val, err := database.RedisConn.Get(ctx, "sess-"+remoteWorkerID).Result()
		if err != nil {
			log.Println("Remote worker redis get connect error:", err)
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{
				"r": "Unauthorized - error getting session",
			})
		}

		// log.Println(val, sessionID)

		if val != sessionID {
			log.Println("Remote worker session mismatch:")
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{
				"r": "Unauthorized - session doesn't exist or expired",
			})
		}

		// --- Pass through context
		c.Locals("remoteWorkerID", remoteWorkerID)
		c.Locals("sessionID", sessionID)
		c.Locals("request", request)

		return c.Next()
	}
}
