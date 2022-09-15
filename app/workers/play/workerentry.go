package main

import (
	"dataplane/workers/config"
	"dataplane/workers/database"
	distfilesystem "dataplane/workers/dist_file_system"
	"log"
)

func main() {
	config.LoadConfig()
	database.DBConnect()
	log.Println("🏃 Running")
	// CreateFiles()
	distfilesystem.DownloadFiles()
}
