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
	dpconfig.LoadConfig()

	createDirectory := dpconfig.CodeDirectory + "/test/zipfolder/"

	zipDirectory := dpconfig.CodeDirectory + "/test/trash/"

	zipfile := zipDirectory + "ziptest.zip"

	log.Println("Folder to zip: ", createDirectory, " -> ", zipfile)

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

	if _, err := os.Stat(zipfile); os.IsExist(err) {
		err := os.Remove(zipfile)
		if err != nil {
			t.Error(err)
		}
	}
	ZipSource(createDirectory, zipfile)

	if _, err := os.Stat(zipfile); os.IsNotExist(err) {
		t.Error("Failed to create zip file")
	}

	stop := time.Now()
	// Do something with response
	log.Println("🐆 Runtime:", fmt.Sprintf("%f", float32(stop.Sub(start))/float32(time.Millisecond))+"ms")

	// assert.Equalf(t, "Hi_there_I_am_a_Folder", output, "Folder friendly.")

}
