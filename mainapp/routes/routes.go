package routes

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/recover"
)

func Setup() *fiber.App {
	// Fiber instance

	// ------- ERROR LOG CONNECT ------

	app := fiber.New()

	// ------- DATABASE CONNECT ------
	// database.Connect()
	// log.Println("Running on:", config.GConf.ENV)

	// ------- RUN MIGRATIONS ------
	// database.Migrate()

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
	// app.Post("/graphql", GraphqlHandler())

	app.Get("healthz", func(c *fiber.Ctx) error {
		return c.SendString("Hello 👋!")
	})

	return app
}

// func GraphqlHandler() fiber.Handler {
// 	h := handler.NewDefaultServer(generated.NewExecutableSchema(generated.Config{Resolvers: &resolvers.Resolver{}}))

// 	return httpHandler(h)
// }

// // httpHandler wraps net/http handler to fiber handler
// func httpHandler(h http.Handler) fiber.Handler {
// 	return func(c *fiber.Ctx) error {
// 		c.Locals("fiberCtx", c)
// 		handler := fasthttpadaptor.NewFastHTTPHandler(h)
// 		handler(c.Context())
// 		return nil
// 	}
// }
