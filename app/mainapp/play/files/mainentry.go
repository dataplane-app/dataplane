package main

import (
	"log"

	distributefilesystem "github.com/dataplane-app/dataplane/mainapp/code_editor/distribute_filesystem"
	dpconfig "github.com/dataplane-app/dataplane/mainapp/config"
	"github.com/dataplane-app/dataplane/mainapp/database"
)

func main() {
	dpconfig.LoadConfig()
	database.DBConnect()
	log.Println("🏃 Running")
	// CreateFiles()
	distributefilesystem.MoveCodeFilesToDB(database.DBConn)
}
