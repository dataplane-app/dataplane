package filesystem

import (
	"dataplane/mainapp/database"
	"dataplane/mainapp/database/models"

	"gorm.io/gorm"
)

func FileConstructByID(db *gorm.DB, id string) (string, error) {
	var currentFile models.CodeFiles

	db.Where("file_id=?", id).First(&currentFile)

	fileName := currentFile.FileName
	folderID := currentFile.FolderID

	// Folder
	folderPath, _ := FolderConstructByID(database.DBConn, folderID)

	return folderPath + fileName, nil
}
