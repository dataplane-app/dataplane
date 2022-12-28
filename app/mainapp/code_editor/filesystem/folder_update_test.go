package filesystem

import (
	"log"
	"os"
	"testing"

	dpconfig "github.com/dataplane-app/dataplane/app/mainapp/config"
	"github.com/google/uuid"

	"github.com/dataplane-app/dataplane/app/mainapp/database"
	"github.com/dataplane-app/dataplane/app/mainapp/database/models"
)

/*
Update pipeline folder test
go test -count=1 -timeout 30s -v -run ^TestUpdateFolder$ github.com/dataplane-app/dataplane/app/mainapp/utilities
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

	fid := uuid.NewString()

	id := "myfolderid--" + FolderFriendly(fid)
	envID := "test-id"

	OLDinput := models.CodeFolders{
		FolderID:      id,
		FolderName:    "OLD" + FolderFriendly(fid),
		EnvironmentID: envID,
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

	_, actual, _, _ := UpdateFolder(database.DBConn, id, OLDinput, Newinput, parentFolder, envID)

	log.Println(actual)

}
