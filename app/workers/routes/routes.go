package routes

import (
	"dataplane/workers/config"
	"dataplane/workers/database"
	"dataplane/workers/database/models"
	"dataplane/workers/messageq"
	"dataplane/workers/runtask"
	"dataplane/workers/secrets"
	"dataplane/workers/workerhealth"
	"fmt"
	"log"
	"os"
	"regexp"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/google/uuid"
)

func Setup(port string) *fiber.App {

	app := fiber.New()

	config.LoadConfig()

	// -------- NATS Connect -------
	messageq.NATSConnect()

	// ------- DATABASE CONNECT ------

	database.DBConnect()
	log.Println("🏃 ======== DATAPLANE WORKER ======== running on: ", os.Getenv("env"))

	// ------ Validate worker data ---------
	if os.Getenv("worker_group") == "" {
		panic("Requires worker_group environment variable")
	}

	// Validate group name
	var isStringAlphaNumeric = regexp.MustCompile(`^[a-zA-Z0-9_]+$`).MatchString
	if !isStringAlphaNumeric(os.Getenv("worker_group")) {
		panic("Worker group - Only [a-z], [A-Z], [0-9] and _ are allowed")
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

	config.EnvName = e.Name
	config.EnvID = e.ID

	start := time.Now()

	// ------- LOAD secrets ------
	secrets.MapSecrets()

	// ----- Load platformID ------
	u := models.Platform{}
	database.DBConn.First(&u)
	config.PlatformID = u.ID
	log.Println("🎯 Platform ID: ", config.PlatformID)

	// Load a worker ID
	config.WorkerID = uuid.NewString()
	log.Println("👷 Worker Group and ID: ", os.Getenv("worker_group"), " - ", config.WorkerID)

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

	// Runner
	// app.Post("/runner", runtask.Runtask())

	// Cancel running job
	app.Post("/runnercancel/:id", runtask.Canceltask())

	// Check healthz
	app.Get("/healthz", func(c *fiber.Ctx) error {
		return c.SendString("Hello 👋! Healthy 🍏")
	})

	/* ---- Listen for tasks ------- */
	runtask.ListenTasks()

	/* Every 5 seconds tell mainapp about my status
	Needs to be called after listen for tasks to avoid timing issues when accepting tasks
	*/
	workerhealth.WorkerHealthStart()

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
