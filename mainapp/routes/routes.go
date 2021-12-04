package routes

import (
	"dataplane/database"
	"dataplane/database/models"
	"dataplane/graphql/generated"
	"dataplane/graphql/resolvers"
	"dataplane/logme"
	"log"
	"net/http"
	"os"

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

	// ------- RUN MIGRATIONS ------
	database.Migrate()
	logme.PlatformLogger(models.LogsPlatform{
		Environment: "d_platform",
		Category:    "platform",
		LogType:     "info", //can be error, info or debug
		Log:         "📦 Database migrated",
	})

	//recover from panic
	app.Use(recover.New())

	// add timer field to response header

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

	// ------- GRAPHQL------
	app.Post("/graphql", GraphqlHandler())

	app.Get("/healthz", func(c *fiber.Ctx) error {
		return c.SendString("Hello 👋!")
	})

	return app
}

func GraphqlHandler() fiber.Handler {
	h := handler.NewDefaultServer(generated.NewExecutableSchema(generated.Config{Resolvers: &resolvers.Resolver{}}))

	return httpHandler(h)
}

// // httpHandler wraps net/http handler to fiber handler
func httpHandler(h http.Handler) fiber.Handler {
	return func(c *fiber.Ctx) error {
		c.Locals("fiberCtx", c)
		handler := fasthttpadaptor.NewFastHTTPHandler(h)
		handler(c.Context())
		return nil
	}
}
