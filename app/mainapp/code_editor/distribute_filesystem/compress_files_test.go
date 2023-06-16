package distributefilesystem

import (
	"bytes"
	"crypto/md5"
	"encoding/hex"
	"fmt"
	"log"
	"testing"
	"time"

	"github.com/dataplane-app/dataplane/app/mainapp/database/models"
	"github.com/stretchr/testify/assert"
)

func timer(name string) func() {
	start := time.Now()
	return func() {
		fmt.Printf("%s took %v\n", name, time.Since(start))
	}
}

/*
Run Super secret squirrel function test
go test -timeout 30s -v -run ^TestCompressTarS2InMemory$ github.com/dataplane-app/dataplane/app/mainapp/code_editor/distribute_filesystem
*/
func TestCompressTarS2InMemory(t *testing.T) {
	// Create a temporary file to add to the tar archive

	defer timer("TestCompressTarS2InMemory")()

	files := []models.CodeFilesCompress{}

	data := []byte("Hello, world!")
	hash := md5.Sum([]byte(data))
	md5 := hex.EncodeToString(hash[:])

	files = append(files, models.CodeFilesCompress{
		FolderPath: "/tmp/hello/",
		FileName:   "helloworld.txt",
		FileStore:  data,
	})

	// Compress the tar archive
	data, _, err := CompressTarS2(files)
	if err != nil {
		log.Println("Compress error:", err)
		t.Fatal(err)
	}

	//Decompress file
	z := bytes.NewBuffer(data)
	decompress, err := DecompressTarS2(z)
	if err != nil {
		log.Println("Decompress error:", err)
		t.Fatal(err)
	}

	// log.Println(decompress)

	// Check that the size of the deflated file is less than a certain threshold
	assert.Equalf(t, md5, decompress[0].ChecksumMD5, "Coompression MD5 check.")
}
