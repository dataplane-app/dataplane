package migrations

import (
	"dataplane/mainapp/config"
	"dataplane/mainapp/database/models"
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"

	// "gorm.io/gorm/clause"
	"dataplane/mainapp/code_editor/filesystem"

	"gorm.io/gorm/clause"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func Migrate() {

	migrateVersion := "0.0.40"

	connectURL := fmt.Sprintf(
		"postgres://%s:%s@%s:%s/%s?sslmode=%s",
		os.Getenv("secret_db_user"),
		os.Getenv("secret_db_pwd"),
		os.Getenv("secret_db_host"),
		os.Getenv("secret_db_port"),
		os.Getenv("secret_db_database"),
		os.Getenv("secret_db_ssl"),
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

			// ---- Files and folders ---
			&models.CodeFilesStore{},
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
		)
		if err1 != nil {
			panic(err1)
		}

		if err := dbConn.Model(&models.Platform{}).Select("migration_version").Where("1 = 1").Update("migration_version", migrateVersion).Error; err != nil {
			panic("Could not retrieve migration version")
		}

		log.Println("💃 Migration updated to v" + migrateVersion)

		hypertable := "SELECT create_hypertable('logs_platform', 'created_at', if_not_exists => TRUE, chunk_time_interval=> INTERVAL '7 Days');"

		if hypertable != "" && config.DPDatabase == "timescaledb" {
			if err := dbConn.Model(&models.LogsPlatform{}).Exec(hypertable).Error; err != nil {
				panic(err)
			}
		}

		hypertable = "SELECT create_hypertable('logs_workers', 'created_at', if_not_exists => TRUE, chunk_time_interval=> INTERVAL '7 Days');"

		if hypertable != "" && config.DPDatabase == "timescaledb" {
			if err := dbConn.Model(&models.LogsPlatform{}).Exec(hypertable).Error; err != nil {
				panic(err)
			}
		}

		hypertable = "SELECT create_hypertable('logs_code_run', 'created_at', if_not_exists => TRUE, chunk_time_interval=> INTERVAL '7 Days');"

		if hypertable != "" && config.DPDatabase == "timescaledb" {
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
