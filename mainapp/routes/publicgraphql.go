package routes

import (
	generated "dataplane/graphql/public"
	publicgraphql "dataplane/graphql/public/resolvers"
	"net/http"

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/gofiber/fiber/v2"
	"github.com/valyala/fasthttp/fasthttpadaptor"
)

/* GraphQL Handlers */
func PublicGraphqlHandler() fiber.Handler {

	h := handler.NewDefaultServer(generated.NewExecutableSchema(generated.Config{Resolvers: &publicgraphql.Resolver{}}))

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
