package filesystem

import (
	"fmt"
	"log"
	"testing"
	"time"

	"github.com/dataplane-app/dataplane/app/mainapp/database"
)

/*
Run Super secret squirrel function test
go test -count=1 -timeout 30s -v -run ^TestDeployFolderConstructByID$ github.com/dataplane-app/dataplane/app/mainapp/code_editor/filesystem
*/
func TestDeployFolderConstructByID(t *testing.T) {

	database.DBConnect()

	id := "83mtTEA"
	envID := "bcaea011-0711-4086-9082-5f9a20c8d8a4"
	version := "0.0.8"

	start := time.Now()
	output, err := DeployFolderConstructByID(database.DBConn, id, envID, "deployments", version)

	log.Println("Folder construct error:", err)

	log.Println("Converted: ", output)
	stop := time.Now()
	// Do something with response
	log.Println("🐆 Runtime:", fmt.Sprintf("%f", float32(stop.Sub(start))/float32(time.Millisecond))+"ms")

	// assert.Equalf(t, "Hi_there_I_am_a_Folder", output, "Folder friendly.")

}
