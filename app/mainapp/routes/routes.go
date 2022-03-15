package routes

import (
	"dataplane/mainapp/auth"
	"dataplane/mainapp/config"
	"dataplane/mainapp/database"
	"dataplane/mainapp/database/models"
	"dataplane/mainapp/logging"
	"dataplane/mainapp/messageq"
	"dataplane/mainapp/pipelines"
	"dataplane/mainapp/platform"
	"dataplane/mainapp/scheduler"
	"dataplane/mainapp/scheduler/routinetasks"
	"dataplane/mainapp/utilities"
	"dataplane/mainapp/worker"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/99designs/gqlgen/graphql/playground"
	"github.com/go-co-op/gocron"
	"github.com/gofiber/adaptor/v2"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/gofiber/websocket/v2"
	"github.com/google/uuid"
	"gorm.io/gorm/clause"
)

type client struct{} // Add more data to this type if needed

var MainAppID string

func Setup(port string) *fiber.App {

	start := time.Now()

	app := fiber.New()

	config.LoadConfig()

	// go runHub()
	MainAppID = uuid.NewString()
	config.MainAppID = MainAppID
	log.Println("🍦 Server ID: ", MainAppID)

	// ------- LOAD secrets ------
	logging.MapSecrets()

	// ------- DATABASE CONNECT ------

	database.DBConnect()
	database.GoDBConnect()
	log.Println("🏃 Running on: ", os.Getenv("env"))

	// -------- NATS Connect -------
	messageq.NATSConnect()

	// ------- RUN MIGRATIONS ------
	database.Migrate()

	// ----- Load platformID ------
	u := models.Platform{}
	database.DBConn.First(&u)
	config.PlatformID = u.ID

	/* --- First time setup, workers will wait for this to be available ---- */
	if u.ID == "" {

		platformData := &models.Platform{
			ID:       uuid.New().String(),
			Complete: false,
			One:      true,
		}

		log.Println("🍽  Platform not found - setup first time.")

		err := database.DBConn.Create(&platformData).Error

		if err != nil {
			if config.Debug == "true" {
				panic(err)
			}
		}
		config.PlatformID = platformData.ID

		// Environments get added
		environment := []models.Environment{
			{ID: uuid.New().String(),
				Name:       "Development",
				PlatformID: config.PlatformID,
				Active:     true}, {
				ID:         uuid.New().String(),
				Name:       "Production",
				PlatformID: config.PlatformID,
				Active:     true,
			},
		}

		err = database.DBConn.Clauses(clause.OnConflict{DoNothing: true}).Create(&environment).Error

		if err != nil {
			if os.Getenv("debug") == "true" {
				logging.PrintSecretsRedact(err)
			}
			panic("Add initial environments database error.")
		}

		// --------- Setup coding directory structure --------

		// directories := &[]models.CodeFolders{}
		if _, err := os.Stat(config.CodeDirectory); os.IsNotExist(err) {
			// path/to/whatever does not exist
			err := os.MkdirAll(config.CodeDirectory, os.ModePerm)
			if err != nil {
				log.Println("Create directory error:", err)
			}
			log.Println("Created directory: ", config.CodeDirectory)

		} else {
			log.Println("Directory already exists: ", config.CodeDirectory)
		}

		// Platform
		platformdir := models.CodeFolders{
			EnvironmentID: "d_platform",
			FolderName:    "Platform",
			Level:         "platform",
			Structure:     "", //must be root of folder/filename
			FType:         "folder",
			Active:        true,
		}

		// Should create a directory as follows code_directory/
		platformFolder := utilities.CreateFolder(platformdir)

		for _, x := range environment {

			envdir := models.CodeFolders{
				EnvironmentID: x.ID,
				FolderName:    x.Name,
				Level:         "environment",
				Structure:     platformFolder.Location, //must be root of folder/filename
				FType:         "folder",
				Active:        true,
			}

			// Should create a directory as follows code_directory/
			utilities.CreateFolder(envdir)

		}

	}
	log.Println("🎯 Platform ID: ", config.PlatformID)

	/* --- Run the scheduler ---- */
	config.Scheduler = gocron.NewScheduler(time.UTC)
	config.Scheduler.StartAsync()

	// logme.PlatformLogger(models.LogsPlatform{
	// 	EnvironmentID: "d_platform",
	// 	Category:      "platform",
	// 	LogType:       "info", //can be error, info or debug
	// 	Log:           "🌟 Database connected",
	// })
	// logme.PlatformLogger(models.LogsPlatform{
	// 	EnvironmentID: "d_platform",
	// 	Category:      "platform",
	// 	LogType:       "info", //can be error, info or debug
	// 	Log:           "📦 Database migrated",
	// })

	// ----- Remove stale tokens ------
	log.Println("💾 Removing stale data")
	go database.DBConn.Delete(&models.AuthRefreshTokens{}, "expires < ?", time.Now())

	// Start websocket hubs
	go worker.RunHub()
	go worker.RunHubRooms()

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
		// Header: ${reqHeaders} Query: ${body}
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
	app.Post("/app/public/graphql", PublicGraphqlHandler())
	app.Post("/app/private/graphql", auth.TokenAuthMiddle(), PrivateGraphqlHandler())

	// WARNING: This is insecure and only for documentation, do not enable in production
	if os.Getenv("graphqldocs") == "true" {
		app.Post("/private/graphqldocs", PrivateGraphqlHandler())
		app.Use("/graphqldocs", adaptor.HTTPHandlerFunc(playgroundHandler()))
	}
	// ------ Auth ------
	/* Exchange a refresh token for a new access token */
	app.Post("/app/refreshtoken", func(c *fiber.Ctx) error {
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
	app.Use("/app/ws", func(c *fiber.Ctx) error {
		// IsWebSocketUpgrade returns true if the client
		// requested upgrade to the WebSocket protocol.
		if websocket.IsWebSocketUpgrade(c) {
			c.Locals("allowed", true)
			return c.Next()
		}
		return fiber.ErrUpgradeRequired
	})

	app.Get("/app/ws/workerstats/:workergroup", auth.TokenAuthMiddleWebsockets(), websocket.New(func(c *websocket.Conn) {

		// log.Println(c.Query("token"))
		worker.WorkerStatsWs(c, "workerstats."+c.Params("workergroup"))
	}))

	app.Get("/app/ws/rooms/:environment", websocket.New(func(c *websocket.Conn) {

		// log.Println(c.Query("token"))
		// room := string(c.Params("room"))
		environment := string(c.Params("environment"))
		subject := string(c.Query("subject"))
		id := string(c.Query("id"))
		worker.RoomUpdates(c, environment, subject, id)
	}))

	// Check healthz
	app.Get("/healthz", func(c *fiber.Ctx) error {
		return c.SendString("Hello 👋! Healthy 🍏")
	})

	/* Worker Load Subscriptions activate */
	worker.LoadWorkers(MainAppID)
	pipelines.RunNextPipeline()
	scheduler.PipelineSchedulerListen()

	// Electing a leader by listening for running nodes
	platform.PlatformNodeListen()
	log.Println("👷 Queue and worker subscriptions")

	/* Scheduled tasks */
	routinetasks.CleanTasks(config.Scheduler, database.DBConn)
	routinetasks.CleanWorkerLogs(config.Scheduler, database.DBConn)
	platform.PlatformNodePublish(config.Scheduler, database.DBConn, MainAppID)

	stop := time.Now()
	// Do something with response
	log.Println("🐆 Start time:", fmt.Sprintf("%f", float32(stop.Sub(start))/float32(time.Millisecond))+"ms")

	if u.Complete == false {
		log.Println("🐣 First time setup at:", "http://localhost:"+port+"/webapp/get-started")
		log.Println("🌍 Visit dashboard at:", "http://localhost:"+port+"/webapp/")
		log.Println(" ** Replace localhost with domain where app is hosted. **")
	} else {
		log.Println("🌍 Visit dashboard at:", "http://localhost:"+port+"/webapp/")
	}

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
