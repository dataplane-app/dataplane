package routes

import (
	"dataplane/database"
	"dataplane/graphql/generated"
	"dataplane/graphql/resolvers"
	"dataplane/logging"
	"log"
	"net/http"
	"os"

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/valyala/fasthttp/fasthttpadaptor"
)

func Setup() *fiber.App {
	// Fiber instance

	// ------- ERROR LOG CONNECT ------
	logging.PrintSecretsRedact("Hello123!", "Squirell")

	app := fiber.New()

	// ------- DATABASE CONNECT ------
	database.DBConnect()
	log.Println("Running on: ", os.Getenv("env"))

	// ------- RUN MIGRATIONS ------
	database.Migrate()

	log.Println("Migrations complete")

	//recover from panic
	app.Use(recover.New())

	// add timer field to response header

	// if config.GConf.DPDebug == "debug" {
	// 	app.Use(logger.New(
	// 		logger.Config{
	// 			Format: "Latency: ${latency} Time:${time} Method:${method} Status: ${status} Path:${path} Host:${host} UA:${ua} Header:${header} Query:${query} \n",
	// 		}))
	// }

	// Body:${body}

	// ------- GRAPHQL------
	app.Post("/graphql", GraphqlHandler())

	app.Get("healthz", func(c *fiber.Ctx) error {
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
