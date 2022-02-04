package routes

import (
	generated "dataplane/mainapp/graphql/privatesubscribe"
	privategraphql "dataplane/mainapp/graphql/privatesubscribe/resolvers"
	"net/http"

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/websocket/v2"
	"github.com/valyala/fasthttp/fasthttpadaptor"
)

/* GraphQL Handlers */
func PrivateSubscribeGraphqlHandler() fiber.Handler {

	// return fiber.ErrUpgradeRequired

	h := handler.NewDefaultServer(generated.NewExecutableSchema(generated.Config{Resolvers: &privategraphql.Resolver{}}))

	return pshttpHandler(h)
}

func pshttpHandler(h http.Handler) fiber.Handler {
	return func(c *fiber.Ctx) error {
		if websocket.IsWebSocketUpgrade(c) {
			c.Locals("allowed", true)
			return c.Next()
		}

		c.Locals("fiberCtx", c)
		handler := fasthttpadaptor.NewFastHTTPHandler(h)
		handler(c.Context())
		return nil
	}
}

// func graphqlServer() fiber.Handler {

// 	srv := handler.New(generated.NewExecutableSchema(generated.Config{Resolvers: &resolvers.Resolver{}}))

// 	srv.AddTransport(transport.Websocket{
// 		KeepAlivePingInterval: 5 * time.Second,
// 		Upgrader: websocket.Upgrader{
// 			CheckOrigin: func(r *http.Request) bool {
// 				return true
// 			},
// 		},
// 	})
// 	srv.AddTransport(transport.Options{})
// 	srv.AddTransport(transport.GET{})
// 	srv.AddTransport(transport.POST{})
// 	srv.AddTransport(transport.MultipartForm{})

// 	// srv.SetQueryCache(lru.New(1000))

// 	srv.Use(extension.Introspection{})
// srv.Use(extension.AutomaticPersistedQuery{
// 	Cache: lru.New(100),
// })

// 	// fmt.Printf("w's type is %T\n", )

// 	return srv
// }

/* GraphQL Subscription Handlers */
// func PrivateSubscribeGraphqlHandler() fiber.Handler {

// 	h := handler.NewDefaultServer(generated.NewExecutableSchema(generated.Config{Resolvers: &gql.Resolver{}}))
// 	// gqlHandler := srv.Handler()

// 	h.AddTransport(transport.Options{})
// 	h.AddTransport(transport.GET{})
// 	h.AddTransport(transport.POST{})
// 	h.AddTransport(transport.MultipartForm{})

// 	// h := handler.NewDefaultServer(generated.NewExecutableSchema(generated.Config{Resolvers: &privategraphql.Resolver{}}))

// 	h.AddTransport(transport.Websocket{
// 		KeepAlivePingInterval: 2 * time.Second,
// 		Upgrader: websocket.FastHTTPUpgrader{
// 			CheckOrigin: func(ctx *fasthttp.RequestCtx) bool {
// 				return true
// 			},
// 		},
// 	})

// 	h.Use(extension.Introspection{})

// 	return pshttpHandler(h)
// }

// func graphqlHandler() http.HandlerFunc {
// 	h := graphqlServer()

// 	return func(rw http.ResponseWriter, r *http.Request) {
// 		h.ServeHTTP(rw, r)
// 	}
// }

// func pshttpHandler(h http.Handler) fiber.Handler {
// 	return func(c *fiber.Ctx) error {
// 		c.Locals("fiberCtx", c)
// 		handler := fasthttpadaptor.NewFastHTTPHandler(h)
// 		handler(c.Context())
// 		return nil
// 	}
// }
