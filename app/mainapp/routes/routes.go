package routes

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/dataplane-app/dataplane/app/mainapp/auth"
	permissions "github.com/dataplane-app/dataplane/app/mainapp/auth_permissions"
	"github.com/dataplane-app/dataplane/app/mainapp/authoidc"
	distributefilesystem "github.com/dataplane-app/dataplane/app/mainapp/code_editor/distribute_filesystem"
	"github.com/dataplane-app/dataplane/app/mainapp/code_editor/filesystem"
	dpconfig "github.com/dataplane-app/dataplane/app/mainapp/config"
	"github.com/dataplane-app/dataplane/app/mainapp/database"
	"github.com/dataplane-app/dataplane/app/mainapp/database/migrations"
	"github.com/dataplane-app/dataplane/app/mainapp/database/models"
	"github.com/dataplane-app/dataplane/app/mainapp/logging"
	"github.com/dataplane-app/dataplane/app/mainapp/messageq"
	"github.com/dataplane-app/dataplane/app/mainapp/pipelines"
	"github.com/dataplane-app/dataplane/app/mainapp/platform"
	"github.com/dataplane-app/dataplane/app/mainapp/remoteworker"
	"github.com/dataplane-app/dataplane/app/mainapp/remoteworker_processgroup"
	"github.com/dataplane-app/dataplane/app/mainapp/scheduler"
	"github.com/dataplane-app/dataplane/app/mainapp/scheduler/routinetasks"
	"github.com/dataplane-app/dataplane/app/mainapp/utilities"
	wsockets "github.com/dataplane-app/dataplane/app/mainapp/websockets"
	"github.com/dataplane-app/dataplane/app/mainapp/worker"
	"github.com/go-redis/redis/v8"
	gonanoid "github.com/matoous/go-nanoid/v2"

	"github.com/99designs/gqlgen/graphql/playground"
	"github.com/go-co-op/gocron"
	"github.com/gofiber/adaptor/v2"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/gofiber/websocket/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"
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
	log.Println("🔢 Dataplane version:", dpconfig.Version)

	// ------- LOAD secrets ------
	logging.MapSecrets()

	// ------- DATABASE CONNECT ------
	database.RedisConnect()
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

		err := database.DBConn.Transaction(func(tx *gorm.DB) error {

			// #Code File Storage: Database, LocalFile, S3
			platformData := &models.Platform{
				ID:              uuid.New().String(),
				CodeFileStorage: dpconfig.FSCodeFileStorage,
				Complete:        false,
				One:             true,
			}

			log.Println("🍽  Platform not found - setup first time.")

			err := tx.Create(&platformData).Error

			if err != nil {
				return err
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

			err = tx.Clauses(clause.OnConflict{DoNothing: true}).Create(&environment).Error

			if err != nil {
				return err
			}

			// --------- Setup coding directory structure --------

			// directories := &[]models.CodeFolders{}
			if _, err := os.Stat(dpconfig.CodeDirectory); os.IsNotExist(err) {
				// path/to/whatever does not exist
				err := os.MkdirAll(dpconfig.CodeDirectory, os.ModePerm)
				if err != nil {
					log.Println("Create directory error:", err)
					return err
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
			platformFolder, _, errdir := filesystem.CreateFolder(platformdir, "")
			if errdir != nil {
				return errdir
			}

			var parentfolder string
			var errfs error
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
				parentfolder, errfs = filesystem.FolderConstructByID(tx, platformFolder.FolderID, x.ID, "")
				if errfs != nil {
					return errfs
				}
				log.Println("Parent folder environment:", parentfolder)

				errfs = nil

				_, _, errfs = filesystem.CreateFolder(envdir, parentfolder)
				if errfs != nil {
					return errfs
				}

				errfs = nil

				// Setup sub directories
				_, errfs = filesystem.CreateFolderSubs(tx, x.ID)
				if errfs != nil {
					return errfs
				}

			}

			return nil

		})

		if err != nil {
			panic("First time setup failed: " + err.Error())
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
		database.DBConn.Model(&models.Platform{}).Where("id = ?", dpconfig.PlatformID).Update("code_file_storage", dpconfig.FSCodeFileStorage)
	}

	/* Load JWT secret if doesn't exist - generated by platform, not default */
	if u.JwtToken == "" {
		tokenGen := uuid.NewString()
		database.DBConn.Model(&models.Platform{}).Where("id = ?", dpconfig.PlatformID).Update("jwt_token", tokenGen)
		u.JwtToken = tokenGen
	}

	auth.JwtKey = []byte(u.JwtToken)

	/* Load encrypt key if doesn't exist - generated by platform, not default */
	if u.EncryptKey == "" {
		encryptkey, err := gonanoid.Generate("1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ", 32)
		if err == nil {
			database.DBConn.Model(&models.Platform{}).Where("id = ?", dpconfig.PlatformID).Update("encrypt_key", encryptkey)
		}
		u.EncryptKey = encryptkey
	}

	if os.Getenv("secret_encryption_key") == "" {
		utilities.Encryptphrase = u.EncryptKey
	} else {
		utilities.Encryptphrase = os.Getenv("secret_encryption_key")
	}

	/* --- Run the scheduler ---- */
	dpconfig.Scheduler = gocron.NewScheduler(time.UTC)
	dpconfig.Scheduler.StartAsync()

	// ----- Remove stale tokens ------
	log.Println("💾 Removing stale data")
	go database.DBConn.Delete(&models.AuthRefreshTokens{}, "expires < ?", time.Now())

	// Start websocket hubs
	go wsockets.RunHub()

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
		AllowOrigins:     dpconfig.AllowOrigins,
		AllowCredentials: true,
		// AllowHeaders: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization, workerID",
	}))

	// --------FRONTEND ----
	app.Static("/webapp", "./frontbuild")
	app.Static("/webapp/*", "./frontbuild/index.html")

	// ----- APP Version ----
	app.Get("/app/version", func(c *fiber.Ctx) error {
		return c.Status(http.StatusOK).JSON(fiber.Map{"Version": dpconfig.Version})
	})


	// ------- API ROUTES ------
	APIRoutes(app)

	// ------- GRAPHQL------
	app.Post("/app/public/graphql", PublicGraphqlHandler())
	app.Post("/app/private/graphql", auth.TokenAuthMiddle(), PrivateGraphqlHandler())
	app.Post("/app/desktop/graphql", auth.DesktopAuthMiddle(), DesktopGraphqlHandler())

	// WARNING: This is insecure and only for documentation, do not enable in production
	if os.Getenv("DP_GRAPHQLDOCS") == "true" {
		app.Post("/private/graphqldocs", PrivateGraphqlHandler())
		app.Use("/graphqldocs", adaptor.HTTPHandlerFunc(playgroundHandler()))
	}
	// ------ Auth ------

	// OIDCConnect()
	if dpconfig.AuthStrategy == "openid" {
		log.Println("🔐 OpenID Connecting...")
		authoidc.OIDCConnect()
	}


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

	app.Get("/app/ws/rooms/:room", auth.TokenAuthMiddleWebsockets(), websocket.New(func(c *websocket.Conn) {

		room := string(c.Params("room"))

		wsockets.RoomUpdates(c, room)
	}))

	/* Authenticate remote worker */
	app.Post("/app/remoteworker/connect/:workerID", func(c *fiber.Ctx) error {
		c.Accepts("application/json")
		remoteWorkerID := string(c.Params("workerID"))

		// body := c.Body()
		authHeader := strings.Split(string(c.Request().Header.Peek("Authorization")), "Bearer ")
		if len(authHeader) != 2 {
			errstring := "Malformed token"
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"r": "error", "msg": errstring, "active": false})
		}
		secretToken := authHeader[1]
		newRefreshToken, err := auth.AuthRemoteWorker(remoteWorkerID, secretToken)
		if err != nil {
			if dpconfig.Debug == "true" {
				logging.PrintSecretsRedact(err.Error())
			}
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "invalid token"})
		}
		return c.Status(http.StatusOK).JSON(fiber.Map{"access_token": newRefreshToken, "remote_worker_id": remoteWorkerID})
	})

	app.Post("/app/remoteworker/codefiles/:environmentID/:nodeID", auth.DesktopAuthMiddle(), func(c *fiber.Ctx) error {

		/* runtype is prefix to folder structure: coderun, pipeline, deployment */
		c.Accepts("application/json")

		// remoteWorkerID := string(c.Params("workerID"))
		nodeID := string(c.Params("nodeID"))
		environmentID := string(c.Params("environmentID"))
		output, filesize, err := remoteworker.CodeRunCompressCodeFiles(database.DBConn, nodeID, environmentID)
		if err != nil {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{"Remote worker code run download file error": err.Error()})
		}

		FileContentType := http.DetectContentType(output)
		c.Append("Content-Type", FileContentType)
		c.Append("Content-Length", strconv.Itoa(filesize))

		return c.Status(http.StatusOK).Send(output)
	})

	app.Post("/app/remoteworker/deployfiles/:environmentID/:nodeID/:version", auth.DesktopAuthMiddle(), func(c *fiber.Ctx) error {

		/* runtype is prefix to folder structure: coderun, pipeline, deployment */
		c.Accepts("application/json")

		// remoteWorkerID := string(c.Params("workerID"))
		nodeID := string(c.Params("nodeID"))
		environmentID := string(c.Params("environmentID"))
		version := string(c.Params("version"))
		output, filesize, err := remoteworker.DeployCompressFiles(database.DBConn, nodeID, environmentID, version)
		if err != nil {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{"Remote worker code run download file error": err.Error()})
		}

		FileContentType := http.DetectContentType(output)
		c.Append("Content-Type", FileContentType)
		c.Append("Content-Length", strconv.Itoa(filesize))

		return c.Status(http.StatusOK).Send(output)
	})

	/* Request all process groups at start of remotw worker */
	app.Post("/app/remoteworker/allprocessgroups/:workerID", auth.DesktopAuthMiddle(), func(c *fiber.Ctx) error {

		c.Accepts("application/json")
		remoteWorkerID := string(c.Params("workerID"))
		output, err := remoteworker_processgroup.AllProcessGroups(remoteWorkerID)
		if err != nil {
			return c.Status(http.StatusBadRequest).JSON(fiber.Map{"Remote worker process groups error": err.Error()})
		}

		return c.Status(http.StatusOK).JSON(output)
	})

	/* ------ REMOTE WORKERS ----- */
	// auth.AuthRemoteWorkerWebsockets(),
	go remoteworker.RPCHub()
	// auth.AuthRemoteWorkerWebsockets(),
	app.Get("/app/ws/remoteworker/jsonrpc/:workerID", websocket.New(func(c *websocket.Conn) {

		remoteWorkerID := string(c.Params("workerID"))
		// c.Locals("remoteWorkerID", remoteWorkerID)

		remoteworker.RPCServer(c, remoteWorkerID)
		/* params are set in auth middleware with locals */
		// jsonrpc.ServeConn(&remoteworker.WebsocketConn{c})
	}))

	// app.Get("/trigger/remote/task", func(c *fiber.Ctx) error {
	// 	remoteworker.Broadcast <- remoteworker.Message{WorkerID: "4061e7e1-5ec9-44ae-ad8c-976957592e8f", Data: []byte(`{"hello":"hello"}`)}
	// 	return c.JSON(fiber.Map{"Response": "OK"})
	// })

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
			{Subject: "user", SubjectID: currentUser, Resource: "environment_edit_all_pipelines", ResourceID: environmentID, Access: "write", EnvironmentID: environmentID},
			{Subject: "user", SubjectID: currentUser, Resource: "specific_pipeline", ResourceID: pipelineID, Access: "write", EnvironmentID: environmentID},
			{Subject: "user", SubjectID: currentUser, Resource: "specific_pipeline", ResourceID: pipelineID, Access: "read", EnvironmentID: environmentID},
			{Subject: "user", SubjectID: currentUser, Resource: "environment_all_pipelines", ResourceID: environmentID, Access: "read", EnvironmentID: environmentID},
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
			{Subject: "user", SubjectID: currentUser, Resource: "admin_environment", ResourceID: environmentID, Access: "write", EnvironmentID: environmentID},
			{Subject: "user", SubjectID: currentUser, Resource: "environment_edit_all_pipelines", ResourceID: environmentID, Access: "write", EnvironmentID: environmentID},
			{Subject: "user", SubjectID: currentUser, Resource: "specific_pipeline", ResourceID: pipelineID, Access: "write", EnvironmentID: environmentID},
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
	app.Post("/publicapi/api-trigger/:id", auth.ApiAuthMiddle("public"), func(c *fiber.Ctx) error {
		c.Accepts("application/json")
		pipelineID := c.Locals("pipelineID").(string)
		environmentID := c.Locals("environmentID").(string)
		bodyLength := c.Locals("bodyLength").(int)
		dataTTL := c.Locals("dataTTL").(float64)

		// var jsonPayload datatypes.JSON = c.Body()

		// Generate run ID
		runID := uuid.NewString()

		//  ----- if data is provided then store in Redis with TTL ----
		if bodyLength > 0 {

			ctx := context.Background()

			if _, err := database.RedisConn.Pipelined(ctx, func(rdb redis.Pipeliner) error {
				// rdb.HSet(ctx, "leader", "nodeid", mainAppID)
				rdb.HSet(ctx, "api-trigger-"+environmentID+"-"+runID, "timestamp", time.Now().UTC().Unix())
				rdb.HSet(ctx, "api-trigger-"+environmentID+"-"+runID, "data", c.Body())
				rdb.Expire(ctx, "api-trigger-"+environmentID+"-"+runID, time.Duration(dataTTL)*time.Second)

				return nil
			}); err != nil {
				log.Println("Failed to set API data: ", err, "Run ID:", runID, "PipelineID:", pipelineID)

				return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
					"Data Platform": "Dataplane",
					"Error":         err.Error(),
				})
			}
		}

		// Run pipeline
		_, errRun := pipelines.RunPipeline(pipelineID, environmentID, runID)
		if errRun != nil {

			log.Println("Failed to run API trigger: ", errRun, "Run ID:", runID, "PipelineID:", pipelineID)

			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
				"Data Platform": "Dataplane",
				"Error":         errRun.Error(),
			})

		}

		return c.Status(http.StatusOK).JSON(fiber.Map{"runID": runID, "Data Platform": "Dataplane"})
	})

	// Pipeline API Trigger private
	app.Post("/privateapi/api-trigger/:id", auth.ApiAuthMiddle("private"), func(c *fiber.Ctx) error {

		c.Accepts("application/json")
		pipelineID := c.Locals("pipelineID").(string)
		environmentID := c.Locals("environmentID").(string)
		bodyLength := c.Locals("bodyLength").(int)
		dataTTL := c.Locals("dataTTL").(float64)

		// var jsonPayload datatypes.JSON = c.Body()

		// Generate run ID
		runID := uuid.NewString()

		//  ----- if data is provided then store in Redis with TTL ----
		if bodyLength > 0 {

			ctx := context.Background()

			if _, err := database.RedisConn.Pipelined(ctx, func(rdb redis.Pipeliner) error {
				// rdb.HSet(ctx, "leader", "nodeid", mainAppID)
				rdb.HSet(ctx, "api-trigger-"+environmentID+"-"+runID, "timestamp", time.Now().UTC().Unix())
				rdb.HSet(ctx, "api-trigger-"+environmentID+"-"+runID, "data", c.Body())
				rdb.Expire(ctx, "api-trigger-"+environmentID+"-"+runID, time.Duration(dataTTL)*time.Second)

				return nil
			}); err != nil {
				log.Println("Failed to set API data: ", err, "Run ID:", runID, "PipelineID:", pipelineID)

				return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
					"Data Platform": "Dataplane",
					"Error":         err.Error(),
				})
			}
		}

		// Run pipeline
		_, errRun := pipelines.RunPipeline(pipelineID, environmentID, runID)
		if errRun != nil {

			log.Println("Failed to run API trigger: ", errRun, "Run ID:", runID, "PipelineID:", pipelineID)

			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
				"Data Platform": "Dataplane",
				"Error":         errRun.Error(),
			})

		}

		return c.Status(http.StatusOK).JSON(fiber.Map{"runID": runID, "Data Platform": "Dataplane"})
	})

	// Deployment API Trigger public
	app.Post("/publicapi/deployment/api-trigger/:version/:id", auth.ApiAuthMiddleDeployment("public"), func(c *fiber.Ctx) error {
		c.Accepts("application/json")
		pipelineID := c.Locals("deploymentID").(string)
		environmentID := c.Locals("environmentID").(string)
		version := string(c.Params("version"))
		bodyLength := c.Locals("bodyLength").(int)
		dataTTL := c.Locals("dataTTL").(float64)

		// Run deployment
		runID := uuid.NewString()

		//  ----- if data is provided then store in Redis with TTL ----
		if bodyLength > 0 {

			ctx := context.Background()

			if _, err := database.RedisConn.Pipelined(ctx, func(rdb redis.Pipeliner) error {
				// rdb.HSet(ctx, "leader", "nodeid", mainAppID)
				rdb.HSet(ctx, "api-trigger-"+environmentID+"-"+runID, "timestamp", time.Now().UTC().Unix())
				rdb.HSet(ctx, "api-trigger-"+environmentID+"-"+runID, "data", c.Body())
				rdb.Expire(ctx, "api-trigger-"+environmentID+"-"+runID, time.Duration(dataTTL)*time.Second)

				return nil
			}); err != nil {
				log.Println("Failed to set API data: ", err, "Run ID:", runID, "PipelineID:", pipelineID)

				return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
					"Data Platform": "Dataplane",
					"Error":         err.Error(),
				})
			}
		}

		// Run deployment
		_, errRun := pipelines.RunDeployment(pipelineID, environmentID, runID, version)
		if errRun != nil {

			log.Println("Failed to run API trigger: ", errRun, "Run ID:", runID, "PipelineID:", pipelineID)

			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
				"Data Platform": "Dataplane",
				"Error":         errRun.Error(),
			})

		}

		return c.Status(http.StatusOK).JSON(fiber.Map{"runID": runID, "Data Platform": "Dataplane"})
	})

	// Deployment API Trigger private :: privateapi/deployment/api-trigger/latest/<id>
	app.Post("/privateapi/deployment/api-trigger/:version/:id", auth.ApiAuthMiddleDeployment("private"), func(c *fiber.Ctx) error {
		c.Accepts("application/json")
		pipelineID := c.Locals("deploymentID").(string)
		environmentID := c.Locals("environmentID").(string)
		version := string(c.Params("version"))
		bodyLength := c.Locals("bodyLength").(int)
		dataTTL := c.Locals("dataTTL").(float64)

		// Run deployment
		runID := uuid.NewString()

		//  ----- if data is provided then store in Redis with TTL ----
		if bodyLength > 0 {

			ctx := context.Background()

			if _, err := database.RedisConn.Pipelined(ctx, func(rdb redis.Pipeliner) error {
				// rdb.HSet(ctx, "leader", "nodeid", mainAppID)
				rdb.HSet(ctx, "api-trigger-"+environmentID+"-"+runID, "timestamp", time.Now().UTC().Unix())
				rdb.HSet(ctx, "api-trigger-"+environmentID+"-"+runID, "data", c.Body())
				rdb.Expire(ctx, "api-trigger-"+environmentID+"-"+runID, time.Duration(dataTTL)*time.Second)

				return nil
			}); err != nil {
				log.Println("Failed to set API data: ", err, "Run ID:", runID, "PipelineID:", pipelineID)

				return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
					"Data Platform": "Dataplane",
					"Error":         err.Error(),
				})
			}
		}

		// Run deployment
		_, errRun := pipelines.RunDeployment(pipelineID, environmentID, runID, version)
		if errRun != nil {

			log.Println("Failed to run API trigger: ", errRun, "Run ID:", runID, "PipelineID:", pipelineID)

			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
				"Data Platform": "Dataplane",
				"Error":         errRun.Error(),
			})

		}

		return c.Status(http.StatusOK).JSON(fiber.Map{"runID": runID, "Data Platform": "Dataplane"})
	})

	// Sync folders to Database
	// app.Post("/sync-folder-database", func(c *fiber.Ctx) error {
	// 	distributefilesystem.MoveCodeFilesToDB(database.DBConn)
	// 	distributefilesystem.DeployFilesToDB(database.DBConn)
	// 	return c.SendString("Finished syncing code files to database.")
	// })

	/* Worker Load Subscriptions activate */
	// worker.LoadWorkers(MainAppID)
	worker.WorkerListen()
	worker.WorkerRemovalListen(dpconfig.Scheduler, database.DBConn)
	pipelines.RunNextPipeline()
	scheduler.PipelineSchedulerListen()

	// Electing a leader by listening for running nodes
	log.Println("👷 Queue and worker subscriptions")

	/* Scheduled tasks */
	routinetasks.CleanTaskLocks(dpconfig.Scheduler, database.DBConn)
	routinetasks.CleanTasks(dpconfig.Scheduler, database.DBConn)
	routinetasks.CleanWorkerLogs(dpconfig.Scheduler, database.DBConn)
	platform.PlatformLeaderElectionScheduler(MainAppID)

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

// Defining the Playground handler
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
