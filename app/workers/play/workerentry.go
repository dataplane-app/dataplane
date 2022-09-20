package main

import (
	wrkerconfig "dataplane/workers/config"
	"dataplane/workers/database"
	distfilesystem "dataplane/workers/dist_file_system"
	"log"
)

func main() {
	wrkerconfig.LoadConfig()
	database.DBConnect()
	log.Println("🏃 Running")
	// CreateFiles()
	distfilesystem.DownloadFiles()
}
