package filesystem

import (
	"log"
	"os"

	dpconfig "github.com/dataplane-app/dataplane/app/mainapp/config"
	"github.com/dataplane-app/dataplane/app/mainapp/database/models"
	"gorm.io/gorm"
)

func UpdateFolder(db *gorm.DB, id string, OLDinput models.CodeFolders, Newinput models.CodeFolders, parentFolder string, environmentID string) (Newoutput models.CodeFolders, updateOLDDirectory string, updateNewDirectory string, errfs error) {

	var OLDDirectory string
	var OLDfoldername string
	var NewDirectory string
	var Newfoldername string

	OLDDirectory = ""
	OLDfoldername = ""
	NewDirectory = ""
	Newfoldername = ""

	// ---- construct old

	OLDinput.FolderID = id
	OLDfoldername = OLDinput.FolderID + "_" + FolderFriendly(OLDinput.FolderName)

	OLDinput.FolderName = FolderFriendly(OLDinput.FolderName)

	OLDDirectory = parentFolder + OLDfoldername

	// ---- construct new
	Newinput.FolderID = id
	Newfoldername = Newinput.FolderID + "_" + FolderFriendly(Newinput.FolderName)

	Newinput.FolderName = FolderFriendly(Newinput.FolderName)

	NewDirectory = parentFolder + Newfoldername

	// ----- Update the database with new values
	errdb := db.Where("folder_id = ? and environment_id = ?", id, environmentID).Updates(&Newinput).Error
	if errdb != nil {
		log.Println("Directory create error:", errdb)
		return models.CodeFolders{}, "", "", errdb
	}

	// Updare the directory
	updateOLDDirectory = dpconfig.CodeDirectory + OLDDirectory
	updateNewDirectory = dpconfig.CodeDirectory + NewDirectory

	if dpconfig.FSCodeFileStorage == "LocalFile" {
		if _, err := os.Stat(updateOLDDirectory); os.IsNotExist(err) {
			// path/to/whatever does not exist
			if dpconfig.Debug == "true" {
				log.Println("Update directory doesn't exist: ", updateOLDDirectory)
			}
			return models.CodeFolders{}, "", "", err

		} else {
			err = os.Rename(updateOLDDirectory, updateNewDirectory)
			if err != nil {
				log.Println("Rename pipeline dir err:", err)
				return models.CodeFolders{}, "", "", err
			}
			if dpconfig.Debug == "true" {
				log.Println("Directory change: ", updateOLDDirectory, "->", updateNewDirectory)
			}
		}
	}

	return Newinput, updateOLDDirectory, updateNewDirectory, nil

}
