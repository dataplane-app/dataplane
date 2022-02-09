package routes

import (
	"dataplane/mainapp/auth"
	"dataplane/mainapp/database"
	"dataplane/mainapp/database/models"
	"dataplane/mainapp/logging"
	"dataplane/mainapp/logme"
	"dataplane/mainapp/messageq"
	"dataplane/mainapp/worker"
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
	"github.com/google/uuid"
)

type client struct{} // Add more data to this type if needed

var MainAppID string

func Setup(port string) *fiber.App {

	app := fiber.New()

	// go runHub()
	MainAppID = uuid.NewString()
	log.Println("🍦 Server ID: ", MainAppID)

	// ------- LOAD secrets ------
	logging.MapSecrets()

	// ------- DATABASE CONNECT ------
	database.DBConnect()
	database.GoDBConnect()
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
	go worker.RunHub()
	go worker.RunHubQueueStats()
	// go worker.SocketsSecureTimeout()

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

	// app.Use("/privatesubscribe/graphql", PrivateSubscribeGraphqlHandler())

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

	app.Get("/ws/workerstats/:workergroup", auth.TokenAuthMiddleWebsockets(), websocket.New(func(c *websocket.Conn) {

		// log.Println(c.Query("token"))
		worker.WorkerStatsWs(c, "workerstats."+c.Params("workergroup"))
	}))

	app.Get("/ws/taskupdates/:room", websocket.New(func(c *websocket.Conn) {

		// log.Println(c.Query("token"))
		// "taskupdates."+c.Params("runid")
		worker.TaskUpdatesWs(c, "taskupdates")
	}))

	// Run Task
	app.Post("/runtask", func(c *fiber.Ctx) error {

		taskID := uuid.NewString()
		err := worker.WorkerRunTask(string(c.Query("workergroup")), taskID, uuid.NewString(), []string{`for((i=1;i<=1000; i+=1)); do echo "1st run $i times"; sleep 0.5; done`, `for((i=1;i<=10; i+=1)); do echo "2nd run $i times"; sleep 0.5; done`})
		if err != nil {
			return c.SendString(err.Error())
		} else {
			return c.SendString("Success: " + taskID)
		}

	})

	app.Post("/runpython", func(c *fiber.Ctx) error {

		taskID := uuid.NewString()
		cmd := string(c.Query("command"))
		err := worker.WorkerRunTask(string(c.Query("workergroup")), taskID, uuid.NewString(), []string{cmd})
		if err != nil {
			return c.SendString(err.Error())
		} else {
			return c.SendString("Success: " + taskID)
		}

	})

	app.Post("/canceltask", func(c *fiber.Ctx) error {

		taskID := string(c.Query("taskid"))
		err := worker.WorkerCancelTask(taskID)
		if err != nil {
			return c.SendString(err.Error())
		} else {
			return c.SendString("Success: " + taskID)
		}

	})

	// Check healthz
	app.Get("/healthz", func(c *fiber.Ctx) error {
		return c.SendString("Hello 👋! Healthy 🍏")
	})

	/* Worker Load Subscriptions activate */
	worker.LoadWorkers(MainAppID)
	worker.UpdateTasks(MainAppID)
	log.Println("👷 Queue and worker subscriptions")

	stop := time.Now()
	// Do something with response
	log.Println("🐆 Start time:", fmt.Sprintf("%f", float32(stop.Sub(start))/float32(time.Millisecond))+"ms")

	log.Println("🌍 Visit dashboard at:", "http://localhost:"+port+"/webapp/")

	// log.Println("Subscribe", hello, err)

	return app

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
