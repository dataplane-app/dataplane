package routes

import (
	generated "dataplane/mainapp/graphql/private"
	privategraphql "dataplane/mainapp/graphql/private/resolvers"
	"net/http"

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/gofiber/fiber/v2"
	"github.com/valyala/fasthttp/fasthttpadaptor"
)

/* GraphQL Handlers */
func PrivateGraphqlHandler() fiber.Handler {

	h := handler.NewDefaultServer(generated.NewExecutableSchema(generated.Config{Resolvers: &privategraphql.Resolver{}}))

	return phttpHandler(h)
}

func phttpHandler(h http.Handler) fiber.Handler {
	return func(c *fiber.Ctx) error {
		c.Locals("fiberCtx", c)
		handler := fasthttpadaptor.NewFastHTTPHandler(h)
		handler(c.Context())
		return nil
	}
}
