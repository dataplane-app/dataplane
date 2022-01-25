package routes

import (
	"dataplane/auth"
	"dataplane/database"
	"dataplane/database/models"
	"dataplane/logging"
	"dataplane/logme"
	"dataplane/messageq"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/99designs/gqlgen/graphql/playground"
	"github.com/gofiber/adaptor/v2"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/gofiber/websocket/v2"
	"github.com/nats-io/nats.go"
)

type client struct{} // Add more data to this type if needed

var clients = make(map[*websocket.Conn]client) // Note: although large maps with pointer-like types (e.g. strings) as keys are slow, using pointers themselves as keys is acceptable and fast
var register = make(chan *websocket.Conn)
var broadcast = make(chan []byte)
var unregister = make(chan *websocket.Conn)
var x = 0

func runHub() {
	for {
		select {
		case connection := <-register:
			clients[connection] = client{}
			log.Println("connection registered")

		case message := <-broadcast:
			log.Println("message received:", string(message))
			x = x + 1

			// Send the message to all clients
			for connection := range clients {
				log.Println("conn:", connection, websocket.TextMessage)
				if err := connection.WriteMessage(x, message); err != nil {
					// 	// 	log.Println("write error:", err)

					connection.WriteMessage(websocket.CloseMessage, []byte{})
					connection.Close()
					delete(clients, connection)
				}
			}

		case connection := <-unregister:
			// Remove the client from the hub
			delete(clients, connection)

			log.Println("connection unregistered")
		}
	}
}

func Setup(port string) *fiber.App {

	app := fiber.New()

	// go runHub()

	// ------- LOAD secrets ------
	logging.MapSecrets()

	// ------- DATABASE CONNECT ------
	database.DBConnect()
	log.Println("🏃 Running on: ", os.Getenv("env"))

	// -------- NATS Connect -------
	messageq.NATSConnect()

	start := time.Now()

	// ------- RUN MIGRATIONS ------
	database.Migrate()
	logme.PlatformLogger(models.LogsPlatform{
		EnvironmentID: "d_platform",
		Category:      "platform",
		LogType:       "info", //can be error, info or debug
		Log:           "🌟 Database connected",
	})
	logme.PlatformLogger(models.LogsPlatform{
		EnvironmentID: "d_platform",
		Category:      "platform",
		LogType:       "info", //can be error, info or debug
		Log:           "📦 Database migrated",
	})

	// ----- Load platformID ------
	u := models.Platform{}
	database.DBConn.First(&u)
	database.PlatformID = u.ID
	log.Println("🎯 Platform ID: ", database.PlatformID)

	// ----- Remove stale tokens ------
	log.Println("💾 Removing stale data")
	go database.DBConn.Delete(&models.AuthRefreshTokens{}, "expires < ?", time.Now())

	// Start the scheduler
	// scheduler.SchedulerStart()

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

	// CORS
	app.Use(cors.New(cors.Config{
		AllowOrigins:     "*",
		AllowCredentials: true,
		// AllowHeaders: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
	}))

	// --------FRONTEND ----
	app.Static("/webapp", "./frontbuild")
	app.Static("/webapp/*", "frontbuild/index.html")

	// ------- GRAPHQL------
	app.Post("/public/graphql", PublicGraphqlHandler())
	app.Post("/private/graphql", auth.TokenAuthMiddle(), PrivateGraphqlHandler())

	app.Use("/privatesubscribe", func(c *fiber.Ctx) error {
		// IsWebSocketUpgrade returns true if the client
		// requested upgrade to the WebSocket protocol.
		if websocket.IsWebSocketUpgrade(c) {
			c.Locals("allowed", true)
			return c.Next()
		}
		return fiber.ErrUpgradeRequired
	})

	app.Use("/privatesubscribe/graphql", PrivateSubscribeGraphqlHandler())

	// WARNING: This is insecure and only for documentation, do not enable in production
	if os.Getenv("graphqldocs") == "true" {
		app.Post("/private/graphqldocs", PrivateGraphqlHandler())
		app.Use("/graphqldocs", adaptor.HTTPHandlerFunc(playgroundHandler()))
	}
	// ------ Auth ------
	/* Exchange a refresh token for a new access token */
	app.Post("/refreshtoken", func(c *fiber.Ctx) error {
		c.Accepts("application/json")
		// body := c.Body()
		authHeader := strings.Split(string(c.Request().Header.Peek("Authorization")), "Bearer ")
		if len(authHeader) != 2 {
			errstring := "Malformed token"
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"r": "error", "msg": errstring, "active": false})
		}
		refreshToken := authHeader[1]
		newRefreshToken, err := auth.RenewAccessToken(refreshToken)
		if err != nil {
			if os.Getenv("debug") == "true" {
				logging.PrintSecretsRedact(err.Error())
			}
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "invalid token"})
		}
		return c.Status(http.StatusOK).JSON(fiber.Map{"access_token": newRefreshToken})
	})

	// Websockets
	app.Use("/ws", func(c *fiber.Ctx) error {
		// IsWebSocketUpgrade returns true if the client
		// requested upgrade to the WebSocket protocol.
		if websocket.IsWebSocketUpgrade(c) {
			c.Locals("allowed", true)
			return c.Next()
		}
		return fiber.ErrUpgradeRequired
	})

	app.Get("/ws/2", websocket.New(func(c *websocket.Conn) {
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
			log.Println("recv: ", msg, mt)

			if err = c.WriteMessage(mt, msg); err != nil {
				log.Println("write:", err)
				break
			}
		}
	}))

	app.Get("/ws/stats", websocket.New(func(c *websocket.Conn) {

		ServeWs(c, "workerstats")
	}))

	app.Use("/ws/hello", websocket.New(func(c *websocket.Conn) {

		y := 0
		// messageq.SubscribeMsgReply("workerload", msg interface{}, resp interface{})
		hello, err1 := messageq.NATSencoded.Subscribe("workerstats", func(m *nats.Msg) {
			messageq.NATSencoded.Publish(m.Reply, []byte("ok"))
			x := []byte(`{"hello":"hello"}`)
			var dat map[string]interface{}
			json.Unmarshal(x, &dat)
			// c.WriteJSON(&x)
			y = y + 1
			c.WriteMessage(y, x)
			log.Println("ok", string(m.Data), string(m.Subject), m.Header)
		})

		log.Println("Subscribe", hello, err1)

		// c.Locals is added to the *websocket.Conn
		log.Println(c.Locals("allowed"))  // true
		log.Println(c.Params("id"))       // 123
		log.Println(c.Query("v"))         // 1.0
		log.Println(c.Cookies("session")) // ""

		// websocket.Conn bindings https://pkg.go.dev/github.com/fasthttp/websocket?tab=doc#pkg-index
		// var (
		// 	mt  int
		// 	msg []byte
		// 	err error
		// )
		// for {
		// 	if mt, msg, err = c.ReadMessage(); err != nil {
		// 		log.Println("read:", err)
		// 		break
		// 	}
		// 	log.Printf("recv: %s", msg)

		// 	if err = c.WriteMessage(mt, msg); err != nil {
		// 		log.Println("write:", err)
		// 		break
		// 	}
		// }

	}))

	// Check healthz
	app.Get("/healthz", func(c *fiber.Ctx) error {
		return c.SendString("Hello 👋! Healthy 🍏")
	})

	stop := time.Now()
	// Do something with response
	log.Println("🐆 Start time:", fmt.Sprintf("%f", float32(stop.Sub(start))/float32(time.Millisecond))+"ms")

	log.Println("🌍 Visit dashboard at:", "http://localhost:"+port+"/webapp/")

	/* Subscriptions activate */
	// messageq.SubscribeMsgReply("workerload", msg interface{}, resp interface{})
	// hello, err := messageq.NATSencoded.Subscribe("workerstats", func(m *nats.Msg) {
	// 	messageq.NATSencoded.Publish(m.Reply, []byte("ok"))
	// 	log.Println("ok", string(m.Data), string(m.Subject), m.Header)
	// })

	// log.Println("Subscribe", hello, err)

	return app

}

// https://github.com/marcelo-tm/testws/blob/master/main.go
func ServeWs(conn *websocket.Conn, subject string) {
	// client := &Client{hub: hub, conn: conn, send: make(chan []byte, 256)}

	// When the function returns, unregister the client and close the connection
	// defer func() {
	// 	unregister <- conn
	// 	conn.Close()
	// }()

	// Register the client
	// register <- conn

	// for {
	// 	messageType, message, err := conn.ReadMessage()
	// 	if err != nil {
	// 		if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
	// 			log.Println("read error:", err)
	// 		}

	// 		return // Calls the deferred function, i.e. closes the connection on error
	// 	}

	// 	if messageType == websocket.TextMessage {
	// 		// Broadcast the received message
	// 		broadcast <- string(message)
	// 	} else {
	// 		log.Println("websocket message received of type", messageType)
	// 	}
	// }

	// var broadcast chan []byte
	messageq.NATSencoded.Subscribe("workerstats", func(m *nats.Msg) {
		// messageq.NATSencoded.Publish(m.Reply, []byte("ok"))
		log.Println(string(m.Data))
		broadcast <- m.Data

	})

	for {

		message := <-broadcast
		if err := conn.WriteMessage(1, []byte(message)); err != nil {
			conn.WriteMessage(websocket.CloseMessage, []byte{})
			conn.Close()
			log.Println("write:", err)
			break
		}

		// defer conn.Close()

		// if _, _, err := conn.Close(); err != nil {
		// 	log.Println("read:", err)
		// 	break
		// }
	}
	// defer messageq.NATSencoded.Close()

	// for {
	// // 	err := conn.WriteMessage(websocket.TextMessage, []byte("hello"))
	// // 	if err != nil {
	// // 		log.Println("write:", err)
	// // 		break
	// // 	}
	// }

	// log.Println("Broadcast: ", &broadcast)

	// Channel Subscriber
	// ch := make(chan *nats.Msg, 64)
	// sub, err := messageq.NATSencoded.Subscribe("workerstats", ch)
	// // handle err
	// for msg := range ch {
	// 	// do something to the nats.Msg object
	// }
	// // Unsubscribe if needed
	// sub.Unsubscribe()
	// close(ch)

	// if err != nil {
	// 	log.Fatal(err)
	// }
	// // messageq.NATSencoded.Flush()

	// for {
	// 	mt, _, err := conn.ReadMessage()

	// 	err = conn.WriteMessage(mt, <-broadcast)
	// 	if err != nil {
	// 		log.Println("write:", err)
	// 		break
	// 	}
	// }

	// subscribe nats
	// sub, err := nc.Subscribe(subject, func(m *nats.Msg) {
	// 	log.Println(string(m.Data))
	// 	broadcast <- m.Data
	// })
	// if err != nil {
	// 	log.Fatal(err)
	// }
	// nc.Flush()

	// if err := nc.LastError(); err != nil {
	// 	log.Fatal(err)
	// }

	// client.natsSub = sub
	// client.hub.register <- client

	// // Allow Connection of memory referenced by the calloer by doing all work in new goroutines
	// go client.writePump()
	// go client.readPump()
}

//Defining the Playground handler
func playgroundHandler() func(w http.ResponseWriter, r *http.Request) {
	query_url := "/private/graphqldocs"
	h := playground.Handler("GraphQL", query_url)
	return func(w http.ResponseWriter, r *http.Request) {
		h.ServeHTTP(w, r)
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
