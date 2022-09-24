package routes

import (
	"dataplane/mainapp/auth"
	permissions "dataplane/mainapp/auth_permissions"
	distributefilesystem "dataplane/mainapp/code_editor/distribute_filesystem"
	"dataplane/mainapp/code_editor/filesystem"
	dpconfig "dataplane/mainapp/config"
	"dataplane/mainapp/database"
	"dataplane/mainapp/database/migrations"
	"dataplane/mainapp/database/models"
	"dataplane/mainapp/logging"
	"dataplane/mainapp/messageq"
	"dataplane/mainapp/pipelines"
	"dataplane/mainapp/platform"
	"dataplane/mainapp/scheduler"
	"dataplane/mainapp/scheduler/routinetasks"
	"dataplane/mainapp/worker"
	"errors"
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
	"gorm.io/datatypes"
	"gorm.io/gorm/clause"
)

type client struct{} // Add more data to this type if needed

var MainAppID string

func Setup(port string) *fiber.App {

	start := time.Now()

	app := fiber.New()

	dpconfig.LoadConfig()

	// ------ Logging ----
	log.Println("🪵  Logging: Debug=", dpconfig.Debug, " | MQ Debug=", dpconfig.MQDebug)

	// go runHub()
	MainAppID = uuid.NewString()
	dpconfig.MainAppID = MainAppID
	log.Println("🍦 Server ID: ", MainAppID)

	// ------- LOAD secrets ------
	logging.MapSecrets()

	// ------- DATABASE CONNECT ------

	database.DBConnect()
	log.Println("🏃 Running")

	// -------- NATS Connect -------
	messageq.NATSConnect()

	// ------- RUN MIGRATIONS ------
	migrations.Migrate()

	// ----- Load platformID ------
	u := models.Platform{}
	database.DBConn.First(&u)
	dpconfig.PlatformID = u.ID

	/* --- First time setup, workers will wait for this to be available ---- */
	if u.ID == "" {

		// #Code File Storage: Database, LocalFile, S3
		platformData := &models.Platform{
			ID:              uuid.New().String(),
			CodeFileStorage: dpconfig.FSCodeFileStorage,
			Complete:        false,
			One:             true,
		}

		log.Println("🍽  Platform not found - setup first time.")

		err := database.DBConn.Create(&platformData).Error

		if err != nil {
			if dpconfig.Debug == "true" {
				panic(err)
			}
		}
		dpconfig.PlatformID = platformData.ID

		// Environments get added
		environment := []models.Environment{
			{ID: uuid.New().String(),
				Name:       "Development",
				PlatformID: dpconfig.PlatformID,
				Active:     true}, {
				ID:         uuid.New().String(),
				Name:       "Production",
				PlatformID: dpconfig.PlatformID,
				Active:     true,
			},
		}

		err = database.DBConn.Clauses(clause.OnConflict{DoNothing: true}).Create(&environment).Error

		if err != nil {
			if dpconfig.Debug == "true" {
				logging.PrintSecretsRedact(err)
			}
			panic("Add initial environments database error.")
		}

		// --------- Setup coding directory structure --------

		// directories := &[]models.CodeFolders{}
		if _, err := os.Stat(dpconfig.CodeDirectory); os.IsNotExist(err) {
			// path/to/whatever does not exist
			err := os.MkdirAll(dpconfig.CodeDirectory, os.ModePerm)
			if err != nil {
				log.Println("Create directory error:", err)
			}
			log.Println("Created platform directory: ", dpconfig.CodeDirectory)

		} else {
			log.Println("Directory already exists: ", dpconfig.CodeDirectory)
		}

		// Platform
		platformdir := models.CodeFolders{
			EnvironmentID: "d_platform",
			FolderName:    "Platform",
			Level:         "platform",
			FType:         "folder",
			Active:        true,
		}

		// Should create a directory as follows code_directory/
		platformFolder, _, _ := filesystem.CreateFolder(platformdir, "")

		var parentfolder string
		for _, x := range environment {

			parentfolder = ""

			envdir := models.CodeFolders{
				ParentID:      platformFolder.FolderID,
				EnvironmentID: x.ID,
				FolderName:    x.Name,
				Level:         "environment",
				FType:         "folder",
				Active:        true,
			}

			// Should create a directory as follows code_directory/
			parentfolder, _ = filesystem.FolderConstructByID(database.DBConn, platformFolder.FolderID, x.ID, "")
			log.Println("Parent folder environment:", parentfolder)
			filesystem.CreateFolder(envdir, parentfolder)

			// Setup sub directories
			filesystem.CreateFolderSubs(database.DBConn, x.ID)

		}

	}
	log.Println("🎯 Platform ID: ", dpconfig.PlatformID)

	/* Load code files if no distributed storage method is defined in platform table.
	Even if a file storage method is used, files will be stored in a database.
	*/
	if u.CodeFileStorage == "" {
		log.Println("💽 Sync files to database")
		distributefilesystem.MoveCodeFilesToDB(database.DBConn)
		distributefilesystem.DeployFilesToDB(database.DBConn)
		database.DBConn.Model(&models.Platform{}).Where("id = ?", u.ID).Update("code_file_storage", dpconfig.FSCodeFileStorage)
	}

	/* --- Run the scheduler ---- */
	dpconfig.Scheduler = gocron.NewScheduler(time.UTC)
	dpconfig.Scheduler.StartAsync()

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

	if dpconfig.Debug == "true" {
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
	app.Static("/webapp/*", "./frontbuild/index.html")

	// ------- GRAPHQL------
	app.Post("/app/public/graphql", PublicGraphqlHandler())
	app.Post("/app/private/graphql", auth.TokenAuthMiddle(), PrivateGraphqlHandler())

	// WARNING: This is insecure and only for documentation, do not enable in production
	if os.Getenv("DP_GRAPHQLDOCS") == "true" {
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
			if dpconfig.Debug == "true" {
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

	app.Get("/app/ws/rooms/:environment", auth.TokenAuthMiddleWebsockets(), websocket.New(func(c *websocket.Conn) {

		// log.Println(c.Query("token"))
		// room := string(c.Params("room"))
		environment := string(c.Params("environment"))
		subject := string(c.Query("subject"))
		id := string(c.Query("id"))
		worker.RoomUpdates(c, environment, subject, id)
	}))

	// Download code files
	app.Get("/app/private/code-files/:fileid", auth.TokenAuthMiddle(), func(c *fiber.Ctx) error {

		environmentID := string(c.Query("environment_id"))
		pipelineID := string(c.Query("pipeline_id"))

		currentUser := c.Locals("currentUser").(string)
		platformID := c.Locals("platformID").(string)

		// ----- Permissions
		perms := []models.Permissions{
			{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
			{Subject: "user", SubjectID: currentUser, Resource: "admin_environment", ResourceID: environmentID, Access: "write", EnvironmentID: environmentID},
			{Subject: "user", SubjectID: currentUser, Resource: "environment_edit_all_pipelines", ResourceID: platformID, Access: "write", EnvironmentID: environmentID},
			{Subject: "user", SubjectID: currentUser, Resource: "specific_pipeline", ResourceID: pipelineID, Access: "write", EnvironmentID: environmentID},
			{Subject: "user", SubjectID: currentUser, Resource: "specific_pipeline", ResourceID: pipelineID, Access: "read", EnvironmentID: environmentID},
			{Subject: "user", SubjectID: currentUser, Resource: "environment_all_pipelines", ResourceID: platformID, Access: "read", EnvironmentID: environmentID},
		}

		permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

		if permOutcome == "denied" {
			return c.Status(fiber.StatusForbidden).SendString("Requires permissions.")
		}

		fileID := string(c.Params("fileid"))

		// filepath, _ := filesystem.FileConstructByID(database.DBConn, fileID, environmentID, "pipelines")

		// dat, err := os.ReadFile(dpconfig.CodeDirectory + filepath)
		dataFile := models.CodeFilesStore{}
		err := database.DBConn.Select("file_store").Where("file_id = ? and environment_id = ?", fileID, environmentID).First(&dataFile).Error
		if err != nil {
			logging.PrintSecretsRedact(err)
			return c.Status(http.StatusBadRequest).SendString("Failed to download file.")
		}
		return c.SendString(string(dataFile.FileStore))
	})

	// Upload code files
	app.Post("/app/private/code-files/:fileid", auth.TokenAuthMiddle(), func(c *fiber.Ctx) error {

		environmentID := string(c.Query("environment_id"))
		pipelineID := string(c.Query("pipeline_id"))
		nodeID := string(c.Query("node_id"))
		folderID := string(c.Query("folder_id"))
		file, _ := c.FormFile("File")

		currentUser := c.Locals("currentUser").(string)
		platformID := c.Locals("platformID").(string)

		// ----- Permissions
		perms := []models.Permissions{
			{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
			{Subject: "user", SubjectID: currentUser, Resource: "platform_environment", ResourceID: platformID, Access: "write", EnvironmentID: environmentID},
			{Subject: "user", SubjectID: currentUser, Resource: "environment_edit_all_pipelines", ResourceID: platformID, Access: "write", EnvironmentID: environmentID},
			{Subject: "user", SubjectID: currentUser, Resource: "specific_pipeline", ResourceID: pipelineID, Access: "write", EnvironmentID: environmentID},
			{Subject: "user", SubjectID: currentUser, Resource: "specific_pipeline", ResourceID: pipelineID, Access: "read", EnvironmentID: environmentID},
			{Subject: "user", SubjectID: currentUser, Resource: "environment_all_pipelines", ResourceID: platformID, Access: "read", EnvironmentID: environmentID},
		}

		permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

		if permOutcome == "denied" {
			return c.Status(fiber.StatusForbidden).SendString("Requires permissions.")
		}

		// Save to code-files
		doc := make([]byte, file.Size)
		docOpen, _ := file.Open()
		docOpen.Read(doc)

		input := models.CodeFiles{
			FolderID:      folderID,
			EnvironmentID: environmentID,
			PipelineID:    pipelineID,
			NodeID:        nodeID,
			FileName:      file.Filename,
			Level:         "node_file",
			FType:         "file",
			Active:        true,
		}

		// Folder excludes code directory
		parentFolder, err := filesystem.FolderConstructByID(database.DBConn, folderID, environmentID, "pipelines")
		if err != nil {
			return errors.New("Create folder - build parent folder failed")
		}

		File, _, err := filesystem.CreateFile(input, parentFolder, doc)
		if err != nil {
			if dpconfig.Debug == "true" {
				log.Println(err)
			}
			return errors.New("Failed to save file.")
		}

		// f := models.CodeFiles{}
		// err = database.DBConn.Where("file_name = ? and folder_id = ? and environment_id = ?", file.Filename, folderID, environmentID).Find(&f).Error
		// if err != nil {
		// 	if dpconfig.Debug == "true" {
		// 		logging.PrintSecretsRedact(err)
		// 	}
		// 	return errors.New("Failed to find file record.")
		// }

		return c.SendString(File.FileID)
	})

	// Pipeline API Trigger public
	app.Post("/app/public/api-trigger/:id", auth.ApiAuthMiddle(), func(c *fiber.Ctx) error {
		pipelineID := c.Locals("pipelineID").(string)
		environmentID := c.Locals("environmentID").(string)

		var jsonPayload datatypes.JSON = c.Body()

		// Run pipeline
		runID := uuid.NewString()
		pipelines.RunPipeline(pipelineID, environmentID, runID, jsonPayload)

		return c.SendString("Success")
	})

	// Pipeline API Trigger private
	app.Post("/app/private/api-trigger/:id", auth.ApiAuthMiddle(), func(c *fiber.Ctx) error {
		pipelineID := c.Locals("pipelineID").(string)
		environmentID := c.Locals("environmentID").(string)

		var jsonPayload datatypes.JSON = c.Body()

		// Run pipeline
		runID := uuid.NewString()
		pipelines.RunPipeline(pipelineID, environmentID, runID, jsonPayload)

		return c.SendString("Success")
	})

	// Check healthz
	app.Get("/healthz", func(c *fiber.Ctx) error {
		return c.SendString("Hello 👋! Healthy 🍏")
	// Sync folders to Database
	app.Post("/sync-folder-database", func(c *fiber.Ctx) error {
		distributefilesystem.MoveCodeFilesToDB(database.DBConn)
		distributefilesystem.DeployFilesToDB(database.DBConn)
		return c.SendString("Finished syncing code files to database.")
	})

	/* Worker Load Subscriptions activate */
	// worker.LoadWorkers(MainAppID)
	worker.WorkerListen()
	worker.WorkerRemovalListen(dpconfig.Scheduler, database.DBConn)
	pipelines.RunNextPipeline()
	scheduler.PipelineSchedulerListen()

	// Electing a leader by listening for running nodes
	platform.PlatformNodeListen()
	log.Println("👷 Queue and worker subscriptions")

	/* Scheduled tasks */
	routinetasks.CleanTaskLocks(dpconfig.Scheduler, database.DBConn)
	routinetasks.CleanTasks(dpconfig.Scheduler, database.DBConn)
	routinetasks.CleanWorkerLogs(dpconfig.Scheduler, database.DBConn)
	platform.PlatformNodePublish(dpconfig.Scheduler, database.DBConn, MainAppID)

	// Check healthz
	app.Get("/healthz", func(c *fiber.Ctx) error {
		return c.SendString("Hello 👋! Healthy 🍏")
	})

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
