package filesystem

import (
	"dataplane/mainapp/config"
	"fmt"
	"log"
	"os"
	"testing"
	"time"
)

/*
Run Super secret squirrel function test
go test -count=1 -timeout 30s -v -run ^TestZIPFolder$ dataplane/mainapp/filesystem
*/
func TestZIPFolder(t *testing.T) {

	// database.DBConnect()
	config.LoadConfig()

	createDirectory := config.CodeDirectory + "/test/zipfolder/"

	zipDirectory := config.CodeDirectory + "/test/trash/"

	log.Println("Folder to zip: ", createDirectory)

	if _, err := os.Stat(createDirectory); os.IsNotExist(err) {
		// path/to/whatever does not exist
		err := os.MkdirAll(createDirectory, os.ModePerm)
		if err != nil {
			t.Error(err)
		}
	}

	if _, err := os.Stat(zipDirectory); os.IsNotExist(err) {
		// path/to/whatever does not exist
		err := os.MkdirAll(zipDirectory, os.ModePerm)
		if err != nil {
			t.Error(err)
		}
	}

	x := []string{"1", "2", "3", "4"}

	for _, y := range x {

		err := os.WriteFile(createDirectory+y+".txt", []byte("String - "+y), 0644)
		if err != nil {
			t.Error(err)
		}
	}

	start := time.Now()

	ZipSource(createDirectory, config.CodeDirectory+"test/trash/ziptest.zip")

	stop := time.Now()
	// Do something with response
	log.Println("🐆 Runtime:", fmt.Sprintf("%f", float32(stop.Sub(start))/float32(time.Millisecond))+"ms")

	// assert.Equalf(t, "Hi_there_I_am_a_Folder", output, "Folder friendly.")

}
