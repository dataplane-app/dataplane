package database

import (
	"fmt"
	"log"
	"os"
	"strconv"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"
)

var DBConn *gorm.DB

func DBConnect() {
	var err error
	DBConn, err = DB()
	if err != nil {
		log.Println(err.Error())
		log.Fatal("Failed to connect to database")
	}
	//DBConn.dpconfig.PrepareStmt = true
}

func DB() (*gorm.DB, error) {

	// dialect, connectionURL := postgresConnectionURL(config)
	connectURL := fmt.Sprintf(
		"postgres://%s:%s@%s:%s/%s?sslmode=%s",
		os.Getenv("DP_DB_USER"),
		os.Getenv("secret_db_pwd"),
		os.Getenv("DP_DB_HOST"),
		os.Getenv("DP_DB_PORT"),
		os.Getenv("DP_DB_DATABASE"),
		os.Getenv("DP_DB_SSL"),
	)

	// log.Println(connectionURL)
	var l logger.LogLevel
	dbDebug, _ := strconv.ParseBool(os.Getenv("DP_DB_DEBUG"))
	if dbDebug {
		l = logger.Info
		log.Println("ℹ️ DB logging: Info")
	} else {
		l = logger.Silent
		log.Println("🤫 DB logging: Silent")
	}

	const maxRetiresAllowed int = 50000

	var dbConn *gorm.DB
	var err error

	for i := 0; i < maxRetiresAllowed; i++ {
		dbConn, err = gorm.Open(postgres.New(postgres.Config{
			DSN: connectURL,
		}), &gorm.Config{
			SkipDefaultTransaction: true,
			NamingStrategy: schema.NamingStrategy{
				SingularTable: true, // use singular table name, table for `User` would be `user` with this option enabled
			},
			Logger: logger.Default.LogMode(l),
		})

		// if err is nil i.e. we connected sucessfully
		if err == nil {
			break
		} else {
			log.Printf("😩 db: connection failure: %v, try number. %d, retry in 5 seconds", err.Error(), i+1)
			time.Sleep(time.Second * 5)
		}
	}

	if err != nil {
		log.Println("db: failed to connect")
		return nil, err
	}

	//--- Connection pooling
	// sqlDB, _ := dbConn.DB()
	// // SetMaxIdleConns sets the maximum number of connections in the idle connection pool.
	// sqlDB.SetMaxIdleConns(18)

	// // SetMaxOpenConns sets the maximum number of open connections to the database.
	// sqlDB.SetMaxOpenConns(18)

	// // SetConnMaxLifetime sets the maximum amount of time a connection may be reused.
	// sqlDB.SetConnMaxLifetime(time.Minute * 5)

	log.Println("🌟 Database connected")

	return dbConn, nil

	// return nil, errors.New("Failed to connect to database")

}
