package privateresolvers

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"context"
	permissions "dataplane/mainapp/auth_permissions"
	"dataplane/mainapp/database"
	"dataplane/mainapp/database/models"
	"dataplane/mainapp/logging"
	"errors"
	"os"
	"strings"

	"github.com/google/uuid"
)

func (r *mutationResolver) AddPipeline(ctx context.Context, name string, environmentID string, description string) (string, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "platform_environment", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return "", errors.New("Requires permissions.")
	}

	e := models.Pipelines{
		PipelineID:    uuid.New().String(),
		Name:          name,
		Description:   description,
		EnvironmentID: environmentID,
		Version:       "0.0.0",
		Active:        true,
		Online:        false,
	}

	err := database.DBConn.Create(&e).Error

	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		if strings.Contains(err.Error(), "duplicate key") {
			return "", errors.New("Pipeline already exists.")
		}
		return "", errors.New("Add pipeline database error.")
	}

	rtn := "success"

	return rtn, nil
}

func (r *queryResolver) GetPipelines(ctx context.Context) ([]*models.Pipelines, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "platform_environment", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return nil, errors.New("Requires permissions.")
	}

	p := []*models.Pipelines{}

	err := database.DBConn.Find(&p).Error
	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("Retrive pipelines database error.")
	}
	return p, nil
}
