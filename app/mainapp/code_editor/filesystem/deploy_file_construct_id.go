package filesystem

import (
	"dataplane/mainapp/database"
	"dataplane/mainapp/database/models"

	"gorm.io/gorm"
)

/*
subbfolder is the folder in code files.
*/
func DeployFileConstructByID(db *gorm.DB, id string, environmentID string, subfolder string, version string) (string, error) {
	var currentFile models.DeployCodeFiles

	db.Select("file_name", "folder_id").Where("file_id=? and environment_id = ?", id, environmentID).First(&currentFile)

	fileName := currentFile.FileName
	folderID := currentFile.FolderID

	// Folder
	folderPath, _ := DeployFolderConstructByID(database.DBConn, folderID, environmentID, subfolder, version)

	return folderPath + fileName, nil
}
