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
	"dataplane/mainapp/logging"
	"dataplane/mainapp/utilities"
	"errors"
	"log"
	"os"
)

func (r *mutationResolver) AddDeployment(ctx context.Context, pipelineID string, fromEnvironmentID string, toEnvironmentID string, version string, workerGroup string) (string, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Deploy To Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "platform_environment", ResourceID: platformID, Access: "write", EnvironmentID: toEnvironmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_deploy_here", ResourceID: platformID, Access: "write", EnvironmentID: toEnvironmentID},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return "", errors.New("Requires permissions: environment_deploy_here")
	}

	// ----- Deploy from Permissions
	perms = []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "platform_environment", ResourceID: platformID, Access: "write", EnvironmentID: fromEnvironmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_edit_all_pipelines", ResourceID: platformID, Access: "write", EnvironmentID: fromEnvironmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "specific_pipeline", ResourceID: pipelineID, Access: "write", EnvironmentID: fromEnvironmentID},
	}

	permOutcome, _, _, _ = permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return "", errors.New("Requires permissions: environment_edit_all_pipelines")
	}

	// Does version already exists?

	// Obtain pipeline details
	// ----- Get pipeline nodes
	pipeline := models.Pipelines{}
	err := database.DBConn.Where("pipeline_id = ? and environment_id = ?", pipelineID, fromEnvironmentID).First(&pipeline).Error
	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Retrieve pipeline database error")
	}

	// Obtain folder structure for pipeline
	pipelineFolder := models.CodeFolders{}
	err = database.DBConn.Where("pipeline_id = ? and environment_id = ? and level = ?", pipelineID, fromEnvironmentID, "pipeline").First(&pipelineFolder).Error
	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Retrieve pipeline folders database error")
	}

	pfolder, _ := filesystem.FolderConstructByID(database.DBConn, pipelineFolder.ParentID, fromEnvironmentID, "")
	foldertocopy, _ := filesystem.FolderConstructByID(database.DBConn, pipelineFolder.FolderID, fromEnvironmentID, "pipelines")

	foldertocopy = config.CodeDirectory + foldertocopy
	destinationfolder := config.CodeDirectory + pfolder + "deployments/" + pipelineFolder.FolderID + "_" + pipelineFolder.FolderName + "/" + version + "/"
	log.Println("Folder to copy:", foldertocopy)
	log.Println("Destination folder:", destinationfolder)

	// Create a folder for the version
	err = utilities.CopyDirectory(foldertocopy, destinationfolder)
	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Failed to copy deployment files.")
	}

	// Copy the files across using file walk

	// Copy pipeline, nodes and edges

	// Copy folder structure
	folders := []*models.CodeFolders{}
	err = database.DBConn.Where("pipeline_id = ? and environment_id = ?", pipelineID, fromEnvironmentID).Find(&folders).Error
	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Retrieve pipeline folders database error")
	}

	// Switch to active
	return "OK", nil
}
