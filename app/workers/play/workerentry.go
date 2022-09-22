package main

import (
	wrkerconfig "dataplane/workers/config"
	"dataplane/workers/database"
	"log"
)

func main() {
	wrkerconfig.LoadConfig()
	database.DBConnect()
	log.Println("🏃 Running")
	// CreateFiles()
	// distfilesystem.DownloadFiles()
}
