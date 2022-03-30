package privateresolvers

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"context"
	permissions "dataplane/mainapp/auth_permissions"
	"dataplane/mainapp/code_editor/filesystem"
	"dataplane/mainapp/config"
	"dataplane/mainapp/database"
	"dataplane/mainapp/database/models"
	privategraphql "dataplane/mainapp/graphql/private"
	"dataplane/mainapp/logging"
	"errors"
	"log"
	"os"
	"os/exec"
	"strings"
	"time"

	"github.com/99designs/gqlgen/graphql"
	"github.com/google/uuid"
)

func (r *mutationResolver) CreateFolderNode(ctx context.Context, input *privategraphql.FolderNodeInput) (*models.CodeFolders, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "platform_environment", ResourceID: platformID, Access: "write", EnvironmentID: input.EnvironmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_edit_all_pipelines", ResourceID: platformID, Access: "write", EnvironmentID: input.EnvironmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "specific_pipeline", ResourceID: input.PipelineID, Access: "write", EnvironmentID: input.EnvironmentID},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return &models.CodeFolders{}, errors.New("Requires permissions.")
	}

	// ----- Add node files to database

	f := models.CodeFolders{
		EnvironmentID: input.EnvironmentID,
		PipelineID:    input.PipelineID,
		NodeID:        input.NodeID,
		FolderID:      input.FolderID,
		ParentID:      input.ParentID,
		FolderName:    input.FolderName,
		FType:         input.FType,
		Level:         uuid.NewString(),
		Active:        input.Active,
	}

	parentFolder, err := filesystem.FolderConstructByID(database.DBConn, input.ParentID, input.EnvironmentID, "pipelines")
	if err != nil {
		return &models.CodeFolders{}, errors.New("Create folder - build parent folder failed")
	}

	rFolderout, _, err := filesystem.CreateFolder(f, parentFolder)
	if err != nil {
		return &models.CodeFolders{}, errors.New("Create folder error")
	}

	return &rFolderout, nil
}

func (r *mutationResolver) MoveFolderNode(ctx context.Context, folderID string, toFolderID string, environmentID string, pipelineID string) (string, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "platform_environment", ResourceID: platformID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_edit_all_pipelines", ResourceID: platformID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "specific_pipeline", ResourceID: pipelineID, Access: "write", EnvironmentID: environmentID},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return "", errors.New("Requires permissions.")
	}

	// Move folder in the directory
	folderpath, _ := filesystem.FolderConstructByID(database.DBConn, folderID, environmentID, "pipelines")
	tofolderpath, _ := filesystem.FolderConstructByID(database.DBConn, toFolderID, environmentID, "pipelines")

	// Make sure there is a path
	if strings.TrimSpace(folderpath) == "" || strings.TrimSpace(tofolderpath) == "" {
		return "", errors.New("Missing folder path.")
	}

	oldDir := config.CodeDirectory + folderpath
	newDir := config.CodeDirectory + tofolderpath

	cmd := exec.Command("cp", "--recursive", oldDir, newDir)
	cmd.Run()

	err := os.RemoveAll(oldDir)
	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Failed to remove old directory.")
	}

	// Update folder's parent in the database
	err = database.DBConn.Model(&models.CodeFolders{}).
		Where("folder_id = ? and environment_id = ?", folderID, environmentID).Update("parent_id", toFolderID).Error
	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Failed to update parent folder in database.")
	}

	return "Success", nil
}

func (r *mutationResolver) DeleteFolderNode(ctx context.Context, environmentID string, folderID string, nodeID string, pipelineID string) (string, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "platform_environment", ResourceID: platformID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_edit_all_pipelines", ResourceID: platformID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "specific_pipeline", ResourceID: pipelineID, Access: "write", EnvironmentID: environmentID},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return "", errors.New("Requires permissions.")
	}

	// Also checks that folder belongs to environment ID
	folderpath, _ := filesystem.FolderConstructByID(database.DBConn, folderID, environmentID, "pipelines")

	// Make sure there is a path
	if strings.TrimSpace(folderpath) == "" {
		return "", errors.New("Missing folder path.")
	}

	// 1. ----- Put folder in the trash

	id := uuid.New().String()

	// Get folder name
	f := models.CodeFolders{}
	err := database.DBConn.Where("folder_id = ? and environment_id = ?", folderID, environmentID).Find(&f).Error
	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Failed to get folder.")
	}

	// Get environment folder id
	ef := models.CodeFolders{}
	err = database.DBConn.Select("folder_id").Where("environment_id = ?", environmentID).Find(&ef).Error
	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Failed to get folder id from database.")
	}

	v, _ := time.Now().UTC().MarshalText()

	trashParent, _ := filesystem.FolderConstructByID(database.DBConn, ef.FolderID, environmentID, "")
	trashPath := config.CodeDirectory + trashParent + "trash/"
	deleteFolder := config.CodeDirectory + folderpath

	// Zip and put in trash
	err = filesystem.ZipSource(deleteFolder, trashPath+string(v)+"-"+id+"-"+f.FolderName+".zip")
	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Failed to zip folder for backup before deletion.")
	}

	// Add to database
	d := models.FolderDeleted{
		ID:            id,
		FolderID:      folderID,
		FolderName:    f.FolderName,
		EnvironmentID: environmentID,
		PipelineID:    pipelineID,
		NodeID:        nodeID,
		FType:         "folder",
	}
	err = database.DBConn.Create(&d).Error
	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Failed to create database record of backup for deletion.")
	}

	// 2. ----- Delete folder and all its contents from directory
	err = os.RemoveAll(deleteFolder)
	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Failed to remove folder and contents.")
	}

	// 3. ----- Delete folder and all its contents from the database

	/* We will simply remove the folder record and let all child folders remain - even if stale */

	// Delete folders from the database only two levels - actual folder and as parent to other folders - rest will remain as stale

	delme := []models.CodeFolders{}

	err = database.DBConn.Where("folder_id = ? and environment_id =?", folderID, environmentID).Delete(&delme).Error
	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Delete folder database error.")
	}

	delme = []models.CodeFolders{}

	err = database.DBConn.Where("parent_id = ? and environment_id =?", folderID, environmentID).Delete(&delme).Error
	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Delete folder database error.")
	}

	// Delete files in database but only first level
	delfiles := []models.CodeFiles{}

	err = database.DBConn.Where("folder_id = ? and environment_id =?", folderID, environmentID).Delete(&delfiles).Error
	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Delete file database error.")
	}

	return "Success", nil
}

func (r *mutationResolver) RenameFolder(ctx context.Context, environmentID string, folderID string, nodeID string, pipelineID string, newName string) (string, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "platform_environment", ResourceID: platformID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_edit_all_pipelines", ResourceID: platformID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "specific_pipeline", ResourceID: pipelineID, Access: "write", EnvironmentID: environmentID},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return "", errors.New("Requires permissions.")
	}

	// Get parent's folder id
	f := models.CodeFolders{}
	err := database.DBConn.Where("folder_id = ? and environment_id = ?", folderID, environmentID).Find(&f).Error
	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Failed to get folder.")
	}

	parentFolderpath, _ := filesystem.FolderConstructByID(database.DBConn, f.ParentID, environmentID, "pipelines")
	folderpath, _ := filesystem.FolderConstructByID(database.DBConn, folderID, environmentID, "pipelines")

	// Make sure there is a path
	if strings.TrimSpace(folderpath) == "" || strings.TrimSpace(parentFolderpath) == "" {
		return "", errors.New("Missing folder path.")
	}

	// 1. ----- Rename folder in the directory
	err = os.Rename(config.CodeDirectory+folderpath, config.CodeDirectory+parentFolderpath+folderID+"_"+newName)
	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Failed to rename folder in directory.")
	}

	// 2. ----- Rename folder in the database
	err = database.DBConn.Model(&models.CodeFolders{}).Where("folder_id = ? and environment_id = ?", folderID, environmentID).Update("folder_name", newName).Error
	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Failed to update folder in database.")
	}

	if os.Getenv("debug") == "true" {
		logging.PrintSecretsRedact("Rename: ", config.CodeDirectory+folderpath, " -> ", config.CodeDirectory+parentFolderpath+folderID+"_"+newName)
	}

	return "Success", nil
}

func (r *mutationResolver) UploadFileNode(ctx context.Context, environmentID string, nodeID string, pipelineID string, folderID string, file graphql.Upload) (string, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "platform_environment", ResourceID: platformID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_edit_all_pipelines", ResourceID: platformID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "specific_pipeline", ResourceID: pipelineID, Access: "write", EnvironmentID: environmentID},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return "", errors.New("Requires permissions.")
	}

	// Save to code-files

	p := make([]byte, file.Size)
	file.File.Read(p)

	input := models.CodeFiles{
		PipelineID:    pipelineID,
		EnvironmentID: environmentID,
		NodeID:        nodeID,
		FileName:      file.Filename,
		Active:        true,
		Level:         "node_file",
		FType:         "file",
		FolderID:      folderID,
	}

	// Folder excludes code directory
	parentFolder, err := filesystem.FolderConstructByID(database.DBConn, folderID, environmentID, "pipelines")
	if err != nil {
		return "", errors.New("Create folder - build parent folder failed")
	}

	_, _, err = filesystem.CreateFile(input, parentFolder, p)
	if err != nil {
		if config.Debug == "true" {
			log.Println(err)
		}
		return "", errors.New("Failed to save file.")
	}

	f := models.CodeFiles{}
	err = database.DBConn.Where("file_name = ? and folder_id = ? and environment_id = ?", file.Filename, folderID, environmentID).Find(&f).Error
	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Failed to find file record.")
	}

	return f.FileID, nil
}

func (r *mutationResolver) DeleteFileNode(ctx context.Context, environmentID string, fileID string, nodeID string, pipelineID string) (string, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "platform_environment", ResourceID: platformID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_edit_all_pipelines", ResourceID: platformID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "specific_pipeline", ResourceID: pipelineID, Access: "write", EnvironmentID: environmentID},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return "", errors.New("Requires permissions.")
	}

	folderpath, _ := filesystem.FileConstructByID(database.DBConn, fileID, environmentID, "pipelines")

	// Make sure there is a path
	if strings.TrimSpace(folderpath) == "" {
		return "", errors.New("Missing folder path.")
	}

	// 1. ----- Put file in the trash

	id := uuid.New().String()

	// Get file name
	f := models.CodeFiles{}
	err := database.DBConn.Where("file_id = ? and environment_id = ?", fileID, environmentID).Find(&f).Error
	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Failed to get file name from database.")
	}

	// Add to database
	d := models.FolderDeleted{
		ID:            id,
		FileID:        fileID,
		FileName:      f.FileName,
		EnvironmentID: environmentID,
		PipelineID:    pipelineID,
		NodeID:        nodeID,
		FType:         "file",
	}
	err = database.DBConn.Create(&d).Error
	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Failed to create backup trash record in database.")
	}

	// Delete file from folder

	// Get environment folder id
	fo := models.CodeFolders{}
	err = database.DBConn.Select("folder_id").Where("environment_id = ?", environmentID).Find(&fo).Error
	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Failed to get folder id from database.")
	}

	filepath, _ := filesystem.FileConstructByID(database.DBConn, fileID, environmentID, "pipelines")
	trashParent, _ := filesystem.FolderConstructByID(database.DBConn, fo.FolderID, environmentID, "")

	v, _ := time.Now().UTC().MarshalText()

	deleteFile := config.CodeDirectory + filepath
	trashPath := config.CodeDirectory + trashParent + "trash/"

	// Zip and put in trash
	err = filesystem.ZipSource(deleteFile, trashPath+string(v)+"-"+id+"-"+f.FileName+".zip")
	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Failed to zip backup before deletion.")
	}

	err = os.Remove(deleteFile)
	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Failed to delete file in directory.")
	}

	// Delete file from database
	f = models.CodeFiles{}

	err = database.DBConn.Where("file_id = ? and environment_id = ?", fileID, environmentID).Delete(&f).Error

	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Delete file database error.")
	}

	return "Success", nil
}

func (r *mutationResolver) RenameFile(ctx context.Context, environmentID string, fileID string, nodeID string, pipelineID string, newName string) (string, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "platform_environment", ResourceID: platformID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_edit_all_pipelines", ResourceID: platformID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "specific_pipeline", ResourceID: pipelineID, Access: "write", EnvironmentID: environmentID},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return "", errors.New("Requires permissions.")
	}

	// Get parent's folder id
	f := models.CodeFiles{}
	err := database.DBConn.Where("file_id = ? and environment_id = ?", fileID, environmentID).Find(&f).Error
	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Failed to file's folder.")
	}

	folderpath, _ := filesystem.FolderConstructByID(database.DBConn, f.FolderID, environmentID, "pipelines")
	filepath, _ := filesystem.FileConstructByID(database.DBConn, fileID, environmentID, "pipelines")

	// Make sure there is a path
	if strings.TrimSpace(filepath) == "" || strings.TrimSpace(folderpath) == "" {
		return "", errors.New("Missing folder path.")
	}

	// // 1. ----- Rename file in the directory
	err = os.Rename(config.CodeDirectory+filepath, config.CodeDirectory+folderpath+newName)
	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Rename file in directory failed.")
	}

	// // 2. ----- Rename file in the database
	err = database.DBConn.Model(&models.CodeFiles{}).Where("file_id = ? and environment_id = ?", fileID, environmentID).Update("file_name", newName).Error
	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Rename file in database failed.")
	}

	if os.Getenv("debug") == "true" {
		logging.PrintSecretsRedact("Rename: ", config.CodeDirectory+filepath, " -> ", config.CodeDirectory+folderpath+newName)
	}

	return "Success", nil
}

func (r *mutationResolver) MoveFileNode(ctx context.Context, fileID string, toFolderID string, environmentID string, pipelineID string) (string, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "platform_environment", ResourceID: platformID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_edit_all_pipelines", ResourceID: platformID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "specific_pipeline", ResourceID: pipelineID, Access: "write", EnvironmentID: environmentID},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return "", errors.New("Requires permissions.")
	}

	// Move folder in the directory
	folderpathWithFile, _ := filesystem.FileConstructByID(database.DBConn, fileID, environmentID, "pipelines")
	tofolderpath, _ := filesystem.FolderConstructByID(database.DBConn, toFolderID, environmentID, "pipelines")

	// Make sure there is a path
	if strings.TrimSpace(folderpathWithFile) == "" || strings.TrimSpace(tofolderpath) == "" {
		return "", errors.New("Missing folder path.")
	}

	f := models.CodeFiles{}

	// Get filename
	err := database.DBConn.Where("file_id = ? and environment_id = ?", fileID, environmentID).Find(&f).Error
	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Retrive user database error.")
	}

	// Move file in the directory
	err = os.Rename(config.CodeDirectory+folderpathWithFile, config.CodeDirectory+tofolderpath+f.FileName)
	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Move file failed.")
	}

	// Update files's parent in the database
	err = database.DBConn.Model(&models.CodeFiles{}).
		Where("file_id = ? and environment_id = ?", fileID, environmentID).Update("folder_id", toFolderID).Error
	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Move file in database failed")
	}

	return "Success", nil
}

func (r *mutationResolver) CodeEditorRun(ctx context.Context, environmentID string, nodeID string, pipelineID string, path string) (string, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "platform_environment", ResourceID: platformID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_edit_all_pipelines", ResourceID: platformID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "specific_pipeline", ResourceID: pipelineID, Access: "write", EnvironmentID: environmentID},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return "", errors.New("Requires permissions.")
	}

	log.Println("Path: ", path)

	return "Success", nil
}

func (r *queryResolver) FilesNode(ctx context.Context, environmentID string, nodeID string, pipelineID string) (*privategraphql.CodeTree, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "platform_environment", ResourceID: platformID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_edit_all_pipelines", ResourceID: platformID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "specific_pipeline", ResourceID: pipelineID, Access: "write", EnvironmentID: environmentID},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return nil, errors.New("Requires permissions.")
	}

	fo := []*models.CodeFolders{}

	err := database.DBConn.Where("node_id = ? and environment_id = ?", nodeID, environmentID).Find(&fo).Error
	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("Retrive user database error.")
	}

	fi := []*models.CodeFiles{}

	err = database.DBConn.Where("node_id = ? and environment_id = ?", nodeID, environmentID).Find(&fi).Error
	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("Retrive user database error.")
	}

	t := privategraphql.CodeTree{
		Folders: fo,
		Files:   fi,
	}

	return &t, nil
}
