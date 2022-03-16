package utilities

import (
	"dataplane/mainapp/database"
	"fmt"
	"log"
	"testing"
	"time"
)

/*
Run Super secret squirrel function test
go test -count=1 -timeout 30s -v -run ^TestFolderConstructByID$ dataplane/mainapp/utilities
*/
func TestFolderConstructByID(t *testing.T) {

	database.DBConnect()

	id := "qAVAMSVX5z"

	start := time.Now()
	output, err := FolderConstructByID(id)

	log.Println("Folder construct error:", err)

	log.Println("Converted: ", output)
	stop := time.Now()
	// Do something with response
	log.Println("🐆 Runtime:", fmt.Sprintf("%f", float32(stop.Sub(start))/float32(time.Millisecond))+"ms")

	// assert.Equalf(t, "Hi_there_I_am_a_Folder", output, "Folder friendly.")

}
