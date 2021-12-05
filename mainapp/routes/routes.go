package routes

import (
	"dataplane/database"
	"dataplane/database/models"
	"dataplane/graphql/generated"
	"dataplane/graphql/resolvers"
	"dataplane/logme"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/valyala/fasthttp/fasthttpadaptor"
)

func Setup() *fiber.App {

	app := fiber.New()

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
	go database.DBConn.Delete(&models.AuthRefreshTokens{}, "expiry < ?", time.Now())

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
	app.Post("/graphql", GraphqlHandler())

	app.Get("/healthz", func(c *fiber.Ctx) error {
		return c.SendString("Hello 👋!")
	})

	stop := time.Now()
	// Do something with response
	log.Println("🐆 Start time:", fmt.Sprintf("%f", float32(stop.Sub(start))/float32(time.Millisecond))+"ms")

	return app
}

/* GraphQL Handlers */
func GraphqlHandler() fiber.Handler {
	h := handler.NewDefaultServer(generated.NewExecutableSchema(generated.Config{Resolvers: &resolvers.Resolver{}}))

	return httpHandler(h)
}

func httpHandler(h http.Handler) fiber.Handler {
	return func(c *fiber.Ctx) error {
		c.Locals("fiberCtx", c)
		handler := fasthttpadaptor.NewFastHTTPHandler(h)
		handler(c.Context())
		return nil
	}
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
