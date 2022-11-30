package migrations

import (
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"

	dpconfig "github.com/dataplane-app/dataplane/app/mainapp/config"
	"github.com/dataplane-app/dataplane/app/mainapp/database/models"

	// "gorm.io/gorm/clause"
	"github.com/dataplane-app/dataplane/app/mainapp/code_editor/filesystem"

	"gorm.io/gorm/clause"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func Migrate() {

	migrateVersion := "0.0.58"

	connectURL := fmt.Sprintf(
		"postgres://%s:%s@%s:%s/%s?sslmode=%s",
		os.Getenv("DP_DB_USER"),
		os.Getenv("secret_db_pwd"),
		os.Getenv("DP_DB_HOST"),
		os.Getenv("DP_DB_PORT"),
		os.Getenv("DP_DB_DATABASE"),
		os.Getenv("DP_DB_SSL"),
	)

	var l logger.LogLevel
	dbDebug, _ := strconv.ParseBool(os.Getenv("DP_DB_DEBUG"))
	if dbDebug {
		l = logger.Info
		// log.Println("DB logging: Info")
	} else {
		l = logger.Silent
		// log.Println("DB logging: Silent")
	}

	dbConn, err := gorm.Open(postgres.Open(connectURL), &gorm.Config{
		NamingStrategy: schema.NamingStrategy{
			SingularTable: true, // use singular table name, table for `User` would be `user` with this option enabled
		},
		Logger: logger.Default.LogMode(l),
	})
	if err != nil {
		panic(err)
	}

	// Always migrate platform table for migration versioning
	err1 := dbConn.AutoMigrate(
		&models.Platform{},
	)
	if err1 != nil {
		panic(err1)
	}

	// ----- Test for migration version mismatch ----
	var currentVersion models.Platform
	if err := dbConn.Select("migration_version").First(&currentVersion).Error; err != nil {
		if err != gorm.ErrRecordNotFound {
			panic("Could not retrieve migration version")
		}
	}

	if currentVersion.MigrationVersion != migrateVersion {

		err1 := dbConn.AutoMigrate(
			&models.Users{},
			&models.LogsPlatform{},
			&models.AuthRefreshTokens{},
			&models.Environment{},
			&models.EnvironmentUser{},
			&models.Preferences{},
			&models.Permissions{},
			&models.PermissionsAccessGroups{},
			&models.PermissionsAccessGUsers{},
			&models.Pipelines{},
			&models.PipelineNodes{},
			&models.PipelineEdges{},
			&models.PipelineRuns{},
			&models.PipelineApiTriggerRuns{},
			&models.PipelineApiTriggers{},
			&models.PipelineApiKeys{},
			&models.ResourceTypeStruct{},
			&models.Secrets{},

			// --- Workers ---
			&models.WorkerGroups{},
			&models.Workers{},
			&models.WorkerSecrets{},
			&models.LogsWorkers{},
			&models.LogsCodeRun{},
			&models.WorkerTasks{},
			&models.WorkerTaskLock{},
			&models.PlatformLeader{},
			&models.Scheduler{},
			&models.SchedulerLock{},
			&models.RemoteProcessGroups{},
			&models.RemoteWorkerEnvironments{},
			&models.RemoteWorkers{},
			&models.RemoteWorkerActivationKeys{},

			// ---- Files and folders ---
			&models.CodeFilesStore{},
			&models.CodeFilesCache{},
			&models.CodeNodeCache{},
			&models.CodeFolders{},
			&models.CodeFiles{},
			&models.CodeGitCommits{},
			&models.FolderDeleted{},
			&models.CodeRun{},
			&models.CodeRunLock{},
			&models.CodePackages{},

			// Deployments
			&models.DeployPipelines{},
			&models.DeployPipelineNodes{},
			&models.DeployPipelineEdges{},
			&models.DeployCodeFolders{},
			&models.DeployCodeFiles{},
			&models.DeployFilesStore{},
			&models.DeployCodeFilesCache{},
			&models.DeployCodeNodeCache{},
			&models.DeploymentApiTriggers{},
			&models.DeploymentApiTriggerRuns{},
			&models.DeploymentApiKeys{},
		)
		if err1 != nil {
			panic(err1)
		}

		if err := dbConn.Model(&models.Platform{}).Select("migration_version").Where("1 = 1").Update("migration_version", migrateVersion).Error; err != nil {
			panic("Could not retrieve migration version")
		}

		log.Println("💃 Migration updated to v" + migrateVersion)

		hypertable := "SELECT create_hypertable('logs_platform', 'created_at', if_not_exists => TRUE, chunk_time_interval=> INTERVAL '7 Days');"

		if hypertable != "" && dpconfig.DPDatabase == "timescaledb" {
			if err := dbConn.Model(&models.LogsPlatform{}).Exec(hypertable).Error; err != nil {
				panic(err)
			}
		}

		hypertable = "SELECT create_hypertable('logs_workers', 'created_at', if_not_exists => TRUE, chunk_time_interval=> INTERVAL '7 Days');"

		if hypertable != "" && dpconfig.DPDatabase == "timescaledb" {
			if err := dbConn.Model(&models.LogsPlatform{}).Exec(hypertable).Error; err != nil {
				panic(err)
			}
		}

		hypertable = "SELECT create_hypertable('logs_code_run', 'created_at', if_not_exists => TRUE, chunk_time_interval=> INTERVAL '7 Days');"

		if hypertable != "" && dpconfig.DPDatabase == "timescaledb" {
			if err := dbConn.Model(&models.LogsPlatform{}).Exec(hypertable).Error; err != nil {
				panic(err)
			}
		}

		// Create any sub folders
		var environs []*models.Environment
		dbConn.Find(&environs)
		for _, env := range environs {
			filesystem.CreateFolderSubs(dbConn, env.ID)
		}

	}

	// ---- load permissions data
	dbConn.Clauses(clause.OnConflict{
		UpdateAll: true,
	}).Create(&models.ResourceType)
	log.Println("🍄 Permission types loaded")

	// ---- load secrets into database
	secretsload := []*models.Secrets{}
	for _, e := range os.Environ() {
		pair := strings.SplitN(e, "=", 2)
		if strings.Contains(pair[0], "secret") {
			secretsload = append(secretsload, &models.Secrets{
				Secret:     strings.ReplaceAll(pair[0], "secret_", ""),
				EnvVar:     pair[0],
				SecretType: "environment",
				Active:     true,
			})
		}

	}

	dbConn.Clauses(clause.OnConflict{
		UpdateAll: true,
	}).Create(&secretsload)
	log.Println("🐿  Secrets loaded")

	log.Println("📦 Database migrated")
}
