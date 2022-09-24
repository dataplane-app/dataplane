package filesystem

import (
	"fmt"
	"log"
	"testing"
	"time"

	"github.com/dataplane-app/dataplane/mainapp/database"
)

/*
Run Super secret squirrel function test
go test -count=1 -timeout 30s -v -run ^TestFolderConstructByID$ github.com/dataplane-app/dataplane/mainapp/code_editor/filesystem
*/
func TestFolderConstructByID(t *testing.T) {

	database.DBConnect()

	id := "7wvOlf8"
	envID := "4aa66e52-c937-4313-abe0-f81629598699"

	start := time.Now()
	output, err := FolderConstructByID(database.DBConn, id, envID, "pipelines")

	log.Println("Folder construct error:", err)

	log.Println("Converted: ", output)
	stop := time.Now()
	// Do something with response
	log.Println("🐆 Runtime:", fmt.Sprintf("%f", float32(stop.Sub(start))/float32(time.Millisecond))+"ms")

	// assert.Equalf(t, "Hi_there_I_am_a_Folder", output, "Folder friendly.")

}
