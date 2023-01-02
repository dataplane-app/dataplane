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
go test -count=1 -timeout 30s -v -run ^TestNodeLevelFolderConstructByID$ github.com/dataplane-app/dataplane/app/mainapp/code_editor/filesystem
*/
func TestNodeLevelFolderConstructByID(t *testing.T) {

	database.DBConnect()

	envID := "2c03a3b1-2d70-40ea-b429-dd8434644c3b"

	/* Root level */
	id := "d4250fe4-c840-4b0f-9a1e-3b4d4061b2d7"

	start := time.Now()
	output, err := NodeLevelFolderConstructByID(database.DBConn, id, envID)

	if err != nil {
		log.Println("Folder construct error:", err)
	}

	log.Println("Converted: ", output)

	/* Sub level */
	id = "75295cf2-748d-4fd6-8dd6-d62c76e264f1"

	output, err = NodeLevelFolderConstructByID(database.DBConn, id, envID)

	if err != nil {
		log.Println("Folder construct error:", err)
	}

	log.Println("Sub folder Converted: ", output)

	/* Sub sub level */
	id = "13613425-72b8-417e-9408-e0676bfd1e47"

	output, err = NodeLevelFolderConstructByID(database.DBConn, id, envID)

	if err != nil {
		log.Println("Folder construct error:", err)
	}

	log.Println("Sub sub folder Converted: ", output)

	/* Sub folder level */
	stop := time.Now()
	// Do something with response
	log.Println("🐆 Runtime:", fmt.Sprintf("%f", float32(stop.Sub(start))/float32(time.Millisecond))+"ms")

	// assert.Equalf(t, "Hi_there_I_am_a_Folder", output, "Folder friendly.")

}
