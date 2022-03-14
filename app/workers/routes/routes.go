package routes

import (
	"dataplane/workers/config"
	"dataplane/workers/database"
	"dataplane/workers/database/models"
	"dataplane/workers/logging"
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
	log.Println("🏃 ======== DATAPLANE WORKER ========")

	// ------ Validate worker data ---------
	if config.WorkerGroup == "" {
		panic("Requires worker_group environment variable")
	}

	// Validate group name
	var isStringAlphaNumeric = regexp.MustCompile(`^[a-zA-Z0-9_]+$`).MatchString
	if !isStringAlphaNumeric(config.WorkerGroup) {
		panic("Worker group - Only [a-z], [A-Z], [0-9] and _ are allowed")
	}

	if config.WorkerType == "" {
		panic("Requires worker_type environment variable")
	}

	if config.WorkerEnv == "" {
		panic("Requires worker_env environment variable")
	}

	// ----- Load platformID ------
	for i := 0; i < 50000; i++ {
		platform := models.Platform{}
		database.DBConn.First(&platform)
		config.PlatformID = platform.ID

		if config.PlatformID != "" {
			break
		} else {
			log.Printf("😩 Platform not setup - waiting for main app to start: try number. %d, retry in 5 seconds", i+1)
			time.Sleep(time.Second * 5)
		}

	}

	log.Println("🎯 Platform ID: ", config.PlatformID)

	e := models.Environment{}
	database.DBConn.First(&e, "name = ?", config.WorkerEnv)

	// if e.Name != config.WorkerEnv  {
	// 	panic("Warning: Envrionment not found. Be sure environment is setup with mainapp - " + config.WorkerEnv)
	// }

	// For first time users create a development environment ID
	if e.ID == "" && config.WorkerEnv == "Development" {
		e = models.Environment{
			ID:         uuid.New().String(),
			Name:       "Development",
			PlatformID: config.PlatformID,
			Active:     true,
		}

		err := database.DBConn.Create(&e).Error

		if err != nil {
			if config.Debug == "true" {
				logging.PrintSecretsRedact(err)
			}
			panic("Failed to create a development environment on first use.")
		}

	}

	config.EnvName = e.Name
	config.EnvID = e.ID
	log.Println("🌳 Environment name and ID: ", config.EnvName, " - ", config.EnvID)

	start := time.Now()

	// ------- LOAD secrets ------
	secrets.MapSecrets()

	// Load a worker ID
	config.WorkerID = uuid.NewString()
	log.Println("👷 Worker Group and ID: ", config.WorkerGroup, " - ", config.WorkerID)

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
	secrets.ListenSecretUpdates()
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
