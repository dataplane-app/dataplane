package main

import (
	distributefilesystem "dataplane/mainapp/code_editor/distribute_filesystem"
	"dataplane/mainapp/config"
	"dataplane/mainapp/database"
	"log"
)

func main() {
	dpconfig.LoadConfig()
	database.DBConnect()
	log.Println("🏃 Running")
	// CreateFiles()
	distributefilesystem.MoveCodeFilesToDB(database.DBConn)
}
