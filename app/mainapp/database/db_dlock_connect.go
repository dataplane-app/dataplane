package database

import (
	"database/sql"
	"dataplane/mainapp/logging"
	"fmt"
	"log"
	"os"
	"time"

	_ "github.com/lib/pq"
)

var DBLock *sql.DB

func NewLockDB() (*sql.DB, error) {
	// export DATABASE_URL='postgres://user:pass@localhost:5432/pglock?sslmode=disable'
	dsn := fmt.Sprintf(
		"postgres://%s:%s@%s:%s/%s?sslmode=%s",
		os.Getenv("secret_db_user"),
		os.Getenv("secret_db_pwd"),
		os.Getenv("secret_db_host"),
		os.Getenv("secret_db_port"),
		os.Getenv("secret_db_database"),
		os.Getenv("secret_db_ssl"),
	)

	const maxRetiresAllowed int = 50000
	var err error

	for i := 0; i < maxRetiresAllowed; i++ {
		DBLock, err = sql.Open("postgres", dsn)

		if err == nil {
			break
		} else {
			log.Printf("😩 db lock: connection failure: %v, try number. %d, retry in 5 seconds", logging.Secrets.Replace(err.Error()), i+1)
			time.Sleep(time.Second * 5)
		}
	}
	if err != nil {
		return nil, err
	}
	return DBLock, DBLock.Ping()
}

func CloseLockDB(db *sql.DB) {
	if err := db.Close(); err != nil {
		log.Fatal(err)
	}
}

// func DBDistributedLockConnect() {
// 	var err error
// 	DBConn, err = DB()
// 	if err != nil {
// 		logging.PrintSecretsRedact(err.Error())
// 		log.Fatal("Failed to connect to database")
// 	}
// 	//DBConn.Config.PrepareStmt = true
// }
