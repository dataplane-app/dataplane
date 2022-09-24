package filesystem

import (
	"dataplane/mainapp/config"
	"dataplane/mainapp/database"
	"dataplane/mainapp/database/models"
	"log"
	"os"
	"testing"

	gonanoid "github.com/matoous/go-nanoid/v2"
)

/*
Update pipeline folder test
go test -count=1 -timeout 30s -v -run ^TestUpdateFolder$ dataplane/mainapp/utilities
*/
func TestUpdateFolder(t *testing.T) {

	dpconfig.LoadConfig()
	database.DBConnect()

	parentFolder := "test/"

	log.Println("Code directory", dpconfig.CodeDirectory)

	// Create parent folder if not exists
	if _, err := os.Stat(dpconfig.CodeDirectory + parentFolder); os.IsNotExist(err) {
		err := os.MkdirAll(dpconfig.CodeDirectory+parentFolder, os.ModePerm)
		if err != nil {
			t.Error("Make parent directory", err)
		}
	}

	fid, _ := gonanoid.New(3)

	id := "myfolderid--" + FolderFriendly(fid)

	OLDinput := models.CodeFolders{
		FolderID:   id,
		FolderName: "OLD" + FolderFriendly(fid),
	}

	oldfolder := dpconfig.CodeDirectory + parentFolder + id + "_" + OLDinput.FolderName
	log.Println("Old folder:", oldfolder)

	if _, err := os.Stat(oldfolder); os.IsNotExist(err) {
		err := os.MkdirAll(oldfolder, os.ModePerm)
		if err != nil {
			t.Error("Make parent directory", err)
		}
	}

	database.DBConn.Create(&OLDinput)

	Newinput := models.CodeFolders{
		FolderID:   id,
		FolderName: OLDinput.FolderName + "-New",
	}

	_, actual, _ := UpdateFolder(id, OLDinput, Newinput, parentFolder)

	log.Println(actual)

}
