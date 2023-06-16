package routes

import (
	"net/http"

	generated "github.com/dataplane-app/dataplane/app/mainapp/graphql/desktop"
	desktopgraphql "github.com/dataplane-app/dataplane/app/mainapp/graphql/desktop/resolvers"

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/gofiber/fiber/v2"
	"github.com/valyala/fasthttp/fasthttpadaptor"
)

/* GraphQL Handlers */
func DesktopGraphqlHandler() fiber.Handler {

	h := handler.NewDefaultServer(generated.NewExecutableSchema(generated.Config{Resolvers: &desktopgraphql.Resolver{}}))

	return dhttpHandler(h)
}

func dhttpHandler(h http.Handler) fiber.Handler {
	return func(c *fiber.Ctx) error {
		c.Locals("fiberCtx", c)
		handler := fasthttpadaptor.NewFastHTTPHandler(h)
		handler(c.Context())
		return nil
	}
}
