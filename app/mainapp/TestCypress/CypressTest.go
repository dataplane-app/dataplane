package main

import (
	"dataplane/mainapp/routes"
	workerroutes "dataplane/workers/routes"
	"fmt"
	"log"
	"os"
	"os/exec"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

/*
Inputs
domain: 127.0.0.1:8000
route: /permission
response: {"r": "OK", "msg": "Permission created", "count": 1}
*/
// func MockingBird() string {

// 	// create a listener with the desired port.
// 	testutils.App = routes.Setup("9000")
// 	err := testutils.App.Listen("0.0.0.0:9000")
// 	if err != nil {
// 		log.Fatal(err)
// 	}

// 	return "hello"

// }

func main() {

	// Build the front end

	cmd := exec.Command("cd frontend && yarn")
	cmd.Env = os.Environ()

	cmd.Stdout = os.Stdout

	if err := cmd.Start(); err != nil {
		log.Fatal(err)
	}

	if err := cmd.Wait(); err != nil {
		log.Fatal(err)
	}

	// Setup a database

	log.Println("Create new database")
	connStr := fmt.Sprintf("user=%s password=%s host=%s port=%s dbname=%s sslmode=disable",
		os.Getenv("secret_db_user"),
		os.Getenv("secret_db_pwd"),
		os.Getenv("secret_db_host"),
		os.Getenv("secret_db_port"),
		"postgres")

	// connect to the postgres db just to be able to run the create db statement
	db, err := gorm.Open(postgres.Open(connStr), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent)})
	if err != nil {
		log.Fatal(err)
	}

	existDb := os.Getenv("secret_db_database")
	newDBname := "cypresstest"

	// check if db exists
	stmt := fmt.Sprintf("SELECT * FROM pg_database WHERE datname = '%s';", newDBname)
	rs := db.Debug().Raw(stmt)
	if rs.Error != nil {
		log.Fatal(rs.Error)
	}

	// if not create it
	var rec = make(map[string]interface{})
	if rs.Find(rec); len(rec) == 0 {
		dropstmt := fmt.Sprintf("DROP DATABASE IF EXISTS %s;", newDBname)
		createstmt := fmt.Sprintf("CREATE DATABASE %s;", newDBname)

		if rs := db.Exec(dropstmt); rs.Error != nil {
			log.Fatal(rs.Error)
		}

		if rs := db.Exec(createstmt); rs.Error != nil {
			log.Fatal(rs.Error)
		}

		// close db connection
		sql, err := db.DB()
		defer func() {
			_ = sql.Close()
		}()
		if err != nil {
			log.Fatal(err)
		}
	}

	os.Setenv("secret_db_database", newDBname)

	// testutils.App = routes.Setup()
	log.Println("Stand up main app")
	app := routes.Setup("9000")
	go func() {
		log.Println("Main app listening on 9000")
		app.Listen("0.0.0.0:9000")
	}()
	// go MockingBird()
	// mb.Start()

	// log.Println("App:", testutils.App)

	// var t *testing.T

	log.Println("Stand up worker 👷")
	appworker := workerroutes.Setup("9005")
	go func() {
		log.Println("Worker listening on 9005")
		appworker.Listen("0.0.0.0:9005")
	}()

	// ----- create general user
	log.Println("Main hello 😃")
	runTests()

	log.Println("Tests complete 👍")

	// Revert Database environment variable
	os.Setenv("secret_db_database", existDb)

	log.Println("Reverted DB:", os.Getenv("secret_db_database"))

	// defer mb.Close()
	// testutils.App.Shutdown()
	// <-finish
	// runTests :=
	os.Exit(0)
}

func runTests() {
	// TODO this flags can be passed from the original command instead.
	cmd := exec.Command("echo", "run test")
	cmd.Env = os.Environ()

	cmd.Stdout = os.Stdout

	if err := cmd.Start(); err != nil {
		log.Fatal(err)
	}

	if err := cmd.Wait(); err != nil {
		log.Fatal(err)
	}
}
