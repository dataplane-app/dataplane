package filesystem

import (
	"dataplane/mainapp/database"
	"dataplane/mainapp/database/models"
	"log"

	"gorm.io/gorm"
)

/*
subbfolder is the folder in code files.
*/
func FileConstructByID(db *gorm.DB, id string, environmentID string, subfolder string) (string, error) {
	var currentFile models.CodeFiles

	err := db.Select("file_name", "folder_id").Where("file_id=? and environment_id = ?", id, environmentID).First(&currentFile).Error
	if err != nil {
		log.Println("Get folder for file:", id, err)
		return "", err
	}

	fileName := currentFile.FileName
	folderID := currentFile.FolderID

	// Folder
	folderPath, errfolder := FolderConstructByID(database.DBConn, folderID, environmentID, subfolder)
	if errfolder != nil {
		log.Println("Get folder for file:", id, errfolder)
		return "", errfolder
	}

	return folderPath + fileName, nil
}
