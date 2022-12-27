# WebSocket

![Release](https://img.shields.io/github/release/gofiber/websocket.svg)
[![Discord](https://img.shields.io/badge/discord-join%20channel-7289DA)](https://gofiber.io/discord)
![Test](https://github.com/gofiber/websocket/workflows/Test/badge.svg)
![Security](https://github.com/gofiber/websocket/workflows/Security/badge.svg)
![Linter](https://github.com/gofiber/websocket/workflows/Linter/badge.svg)

Based on [Fasthttp WebSocket](https://github.com/fasthttp/websocket) for [Fiber](https://github.com/gofiber/fiber) with available `*fiber.Ctx` methods like [Locals](http://docs.gofiber.io/ctx#locals), [Params](http://docs.gofiber.io/ctx#params), [Query](http://docs.gofiber.io/ctx#query) and [Cookies](http://docs.gofiber.io/ctx#cookies).

### Install

```
go get -u github.com/gofiber/fiber/v2
go get -u github.com/gofiber/websocket/v2
```

### Example

```go
package main

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/websocket/v2"
)

func main() {
	app := fiber.New()

	app.Use("/ws", func(c *fiber.Ctx) error {
		// IsWebSocketUpgrade returns true if the client
		// requested upgrade to the WebSocket protocol.
		if websocket.IsWebSocketUpgrade(c) {
			c.Locals("allowed", true)
			return c.Next()
		}
		return fiber.ErrUpgradeRequired
	})

	app.Get("/ws/:id", websocket.New(func(c *websocket.Conn) {
		// c.Locals is added to the *websocket.Conn
		log.Println(c.Locals("allowed"))  // true
		log.Println(c.Params("id"))       // 123
		log.Println(c.Query("v"))         // 1.0
		log.Println(c.Cookies("session")) // ""

		// websocket.Conn bindings https://pkg.go.dev/github.com/fasthttp/websocket?tab=doc#pkg-index
		var (
			mt  int
			msg []byte
			err error
		)
		for {
			if mt, msg, err = c.ReadMessage(); err != nil {
				log.Println("read:", err)
				break
			}
			log.Printf("recv: %s", msg)

			if err = c.WriteMessage(mt, msg); err != nil {
				log.Println("write:", err)
				break
			}
		}

	}))

	log.Fatal(app.Listen(":3000"))
	// Access the websocket server: ws://localhost:3000/ws/123?v=1.0
	// https://www.websocket.org/echo.html
}

```

### Note with cache middleware

If you get the error `websocket: bad handshake` when using the [cache middleware](https://github.com/gofiber/fiber/tree/master/middleware/cache), please use `config.Next` to skip websocket path.

```go
app := fiber.New()
app.Use(cache.New(cache.Config{
		Next: func(c *fiber.Ctx) bool {
			return strings.Contains(c.Route().Path, "/ws")
		},
}))

app.Get("/ws/:id", websocket.New(func(c *websocket.Conn) {}))
```
