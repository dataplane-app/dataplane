package filesystem

import (
	"dataplane/mainapp/database"
	"dataplane/mainapp/database/models"

	"gorm.io/gorm"
)

func FileConstructByID(db *gorm.DB, id string, environmentID string) (string, error) {
	var currentFile models.CodeFiles

	db.Select("file_name", "folder_id").Where("file_id=? and environment_id = ?", id, environmentID).First(&currentFile)

	fileName := currentFile.FileName
	folderID := currentFile.FolderID

	// Folder
	folderPath, _ := FolderConstructByID(database.DBConn, folderID, environmentID)

	return folderPath + fileName, nil
}
