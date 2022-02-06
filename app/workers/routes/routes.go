package routes

import (
	"dataplane/workers/database"
	"dataplane/workers/database/models"
	"dataplane/workers/messageq"
	"dataplane/workers/runtask"
	"dataplane/workers/secrets"
	"dataplane/workers/workerhealth"
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
	secrets.MapSecrets()

	// ------- DATABASE CONNECT ------
	database.DBConnect()
	log.Println("🏃 ======== DATAPLANE WORKER ======== running on: ", os.Getenv("env"))

	// ------ Validate worker data ---------
	if os.Getenv("worker_group") == "" {
		panic("Requires worker_group environment variable")
	}

	if os.Getenv("worker_type") == "" {
		panic("Requires worker_type environment variable")
	}

	if os.Getenv("worker_env") == "" {
		panic("Requires worker_env environment variable")
	}

	if os.Getenv("worker_lb") == "" {
		os.Setenv("worker_lb", "roundrobin")
	}

	e := models.Environment{}
	database.DBConn.First(&e, "name = ?", os.Getenv("worker_env"))

	if e.Name != os.Getenv("worker_env") {
		panic("Envrionment not found - " + os.Getenv("worker_env"))
	}

	// -------- NATS Connect -------
	messageq.NATSConnect()

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
	workerhealth.WorkerHealthStart()

	// Runner
	app.Post("/runner", runtask.Runtask())

	// Cancel running job
	app.Post("/runnercancel/:id", runtask.Canceltask())

	// Check healthz
	app.Get("/healthz", func(c *fiber.Ctx) error {
		return c.SendString("Hello 👋! Healthy 🍏")
	})

	/* ---- Listen for tasks ------- */
	runtask.ListenTasks()

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
