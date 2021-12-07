package routes

import (
	"dataplane/auth"
	"dataplane/database"
	"dataplane/database/models"
	"dataplane/logging"
	"dataplane/logme"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	jsoniter "github.com/json-iterator/go"
)

func Setup() *fiber.App {

	app := fiber.New()

	// ------- LOAD secrets ------
	logging.MapSecrets()

	// ------- DATABASE CONNECT ------
	database.DBConnect()
	log.Println("🏃 Running on: ", os.Getenv("env"))
	logme.PlatformLogger(models.LogsPlatform{
		Environment: "d_platform",
		Category:    "platform",
		LogType:     "info", //can be error, info or debug
		Log:         "🌟 Database connected",
	})

	start := time.Now()

	// ------- RUN MIGRATIONS ------
	database.Migrate()
	logme.PlatformLogger(models.LogsPlatform{
		Environment: "d_platform",
		Category:    "platform",
		LogType:     "info", //can be error, info or debug
		Log:         "📦 Database migrated",
	})

	// ----- Remove stale tokens ------
	log.Println("💾 Removing stale data")
	go database.DBConn.Delete(&models.AuthRefreshTokens{}, "expires < ?", time.Now())

	//recover from panic
	app.Use(recover.New())

	// add timer field to response header
	app.Use(Timer())

	if os.Getenv("debug") == "true" {
		app.Use(logger.New(
			logger.Config{
				Format: "✨ Latency: ${latency} Time:${time} Status: ${status} Path:${path} \n",
			}))
		// Method:${method} -- bug in fiber, waiting for pull request
		// UA:${ua}
		// Host:${host}
		// Header:${header}
		// Query:${query}
	}

	// --------FRONTEND ----
	app.Static("/webapp", "./frontbuild")
	app.Static("/webapp/*", "frontbuild/index.html")

	// ------- GRAPHQL------
	app.Post("/public/graphql", PublicGraphqlHandler())
	app.Post("/private/graphql", auth.TokenAuthMiddle(), PrivateGraphqlHandler())

	// ------ Auth ------
	/* Exchange a refresh token for a new access token */
	app.Post("/refreshtoken", func(c *fiber.Ctx) error {
		c.Accepts("application/json")
		body := c.Body()
		refreshToken := jsoniter.Get(body, "refresh_token").ToString()
		newRefreshToken, err := auth.RenewAccessToken(refreshToken)
		if err != nil {
			if os.Getenv("debug") == "true" {
				logging.PrintSecretsRedact(err.Error())
			}
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "invalid token"})
		}
		return c.Status(http.StatusOK).JSON(fiber.Map{"access_token": newRefreshToken})
	})

	// Check healthz
	app.Get("/healthz", func(c *fiber.Ctx) error {
		return c.SendString("Hello 👋! Healthy 🍏")
	})

	stop := time.Now()
	// Do something with response
	log.Println("🐆 Start time:", fmt.Sprintf("%f", float32(stop.Sub(start))/float32(time.Millisecond))+"ms")

	log.Println("🌍 Visit dashboard at:", "http://localhost:9000/webapp/")

	return app
}

/* Add timer to header */
func Timer() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// start timer
		start := time.Now()
		// next routes
		err := c.Next()
		// stop timer
		stop := time.Now()
		ms := float32(stop.Sub(start)) / float32(time.Millisecond)
		c.Append("Server-Timing", fmt.Sprintf("Dataplane;dur=%f", ms))

		return err
	}
}
