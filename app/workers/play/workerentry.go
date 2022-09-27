package main

import (
	"log"

	"github.com/dataplane-app/dataplane/app/mainapp/database"
	wrkerconfig "github.com/dataplane-app/dataplane/app/workers/config"
)

func main() {
	wrkerconfig.LoadConfig()
	database.DBConnect()
	log.Println("🏃 Running")
	// CreateFiles()
	// distfilesystem.DownloadFiles()
}
