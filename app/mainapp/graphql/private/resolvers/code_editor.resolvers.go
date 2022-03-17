package privateresolvers

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"context"
	permissions "dataplane/mainapp/auth_permissions"
	"dataplane/mainapp/database"
	"dataplane/mainapp/database/models"
	privategraphql "dataplane/mainapp/graphql/private"
	"dataplane/mainapp/logging"
	"errors"
	"os"

	"gorm.io/gorm/clause"
)

func (r *mutationResolver) UpdateFilesNode(ctx context.Context, input []*privategraphql.FilesNodeInput) (string, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "platform_environment", ResourceID: platformID, Access: "write", EnvironmentID: input[0].EnvironmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_edit_all_pipelines", ResourceID: platformID, Access: "write", EnvironmentID: input[0].EnvironmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "specific_pipeline", ResourceID: input[0].PipelineID, Access: "write", EnvironmentID: input[0].EnvironmentID},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return "", errors.New("Requires permissions.")
	}

	// ----- Add node files to database

	for _, p := range input {

		f := &models.CodeFolders{
			EnvironmentID: p.EnvironmentID,
			PipelineID:    p.PipelineID,
			NodeID:        p.NodeID,
			FolderID:      p.FolderID,
			ParentID:      p.ParentID,
			FolderName:    p.FolderName,
			FType:         p.FType,
			Level:         "node",
			Active:        p.Active,
		}

		err := database.DBConn.Clauses(clause.OnConflict{UpdateAll: true}).Where("folder_id = ?", p.FolderID).
			Create(&f).Error

		if err != nil {
			if os.Getenv("debug") == "true" {
				logging.PrintSecretsRedact(err)
			}
			return "", errors.New("updateMe database error.")
		}

	}

	return "Success", nil
}

func (r *queryResolver) FilesNode(ctx context.Context, environmentID string, nodeID string, pipelineID string) (*models.CodeFolders, error) {
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

	f := models.CodeFolders{}

	err := database.DBConn.Where("node_id = ?", nodeID).First(&f).Error
	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("Retrive user database error.")
	}

	return &f, nil
}
