package routes

import (
	"dataplaneworkers/database"
	"dataplaneworkers/database/models"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
)

func Setup(port string) *fiber.App {

	app := fiber.New()

	// ------- LOAD secrets ------
	// logging.MapSecrets()

	// ------- DATABASE CONNECT ------
	database.DBConnect()
	log.Println("🏃 ======== DATAPLANE WORKER ======== running on: ", os.Getenv("env"))

	start := time.Now()

	// ----- Load platformID ------
	u := models.Platform{}
	database.DBConn.First(&u)
	database.PlatformID = u.ID
	log.Println("🎯 Platform ID: ", database.PlatformID)

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

	// Every 5 seconds tell mainapp about my status

	// Runner
	app.Post("/runner", func(c *fiber.Ctx) error {
		return c.SendString("Hello 👋! Healthy 🍏")
	})

	// Check healthz
	app.Get("/healthz", func(c *fiber.Ctx) error {
		return c.SendString("Hello 👋! Healthy 🍏")
	})

	stop := time.Now()
	// Do something with response
	log.Println("🐆 Worker start time:", fmt.Sprintf("%f", float32(stop.Sub(start))/float32(time.Millisecond))+"ms")

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
