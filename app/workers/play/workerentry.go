package main

import (
	"log"

	wrkerconfig "github.com/dataplane-app/dataplane/app/workers/config"
	"github.com/dataplane-app/dataplane/app/workers/database"
)

func main() {
	wrkerconfig.LoadConfig()
	database.DBConnect()
	log.Println("🏃 Running")
	// CreateFiles()
	// distfilesystem.DownloadFiles()
}
