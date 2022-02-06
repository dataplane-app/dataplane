package database

import (
	"dataplane/mainapp/database/models"
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"

	// "gorm.io/gorm/clause"
	"gorm.io/gorm/clause"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func Migrate() {

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
	dbDebug, _ := strconv.ParseBool(os.Getenv("dbdebug"))
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

	err1 := dbConn.AutoMigrate(
		&models.Pipelines{},
		&models.Users{},
		&models.LogsPlatform{},
		&models.AuthRefreshTokens{},
		&models.Environment{},
		&models.EnvironmentUser{},
		&models.Platform{},
		&models.Preferences{},
		&models.Permissions{},
		&models.PermissionsAccessGroups{},
		&models.PermissionsAccessGUsers{},
		&models.Pipelines{},
		&models.PipelinesArchive{},
		&models.ResourceTypeStruct{},
		&models.Secrets{},
		&models.WorkerGroups{},
		&models.Workers{},
		&models.WorkerSecrets{},
		&models.LogsWorkers{},
		&models.WorkerTasks{},
	)
	if err1 != nil {
		panic(err1)
	}

	// ---- load in mcc
	// dbConn.Clauses(clause.OnConflict{
	// 	UpdateAll: true,
	// }).Create(&dataingest.Mcctradeingest)
	// log.Println("mcc loaded")

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

	hypertable := "SELECT create_hypertable('logs_platform', 'created_at', if_not_exists => TRUE, chunk_time_interval=> INTERVAL '7 Days');"

	if hypertable != "" && os.Getenv("database") == "timescaledb" {
		if err := dbConn.Model(&models.LogsPlatform{}).Exec(hypertable).Error; err != nil {
			panic(err)
		}
	}

	hypertable = "SELECT create_hypertable('logs_workers', 'created_at', if_not_exists => TRUE, chunk_time_interval=> INTERVAL '7 Days');"

	if hypertable != "" && os.Getenv("database") == "timescaledb" {
		if err := dbConn.Model(&models.LogsPlatform{}).Exec(hypertable).Error; err != nil {
			panic(err)
		}
	}
	log.Println("📦 Database migrated")
}
