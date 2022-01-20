package privateresolvers

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"context"
	permissions "dataplane/auth_permissions"
	"dataplane/database"
	"dataplane/database/models"
	privategraphql "dataplane/graphql/private"
	"dataplane/logging"
	"errors"
	"os"
)

func (r *mutationResolver) CreateSecret(ctx context.Context, input *privategraphql.AddSecretsInput) (*models.Secrets, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Resource: "admin_platform", ResourceID: platformID, Access: "write", Subject: "user", SubjectID: currentUser, EnvironmentID: "d_platform"},
		{Resource: "admin_environment", ResourceID: input.EnvironmentID, Access: "write", Subject: "user", SubjectID: currentUser, EnvironmentID: input.EnvironmentID},
		{Resource: "environment_secrets", ResourceID: input.EnvironmentID, Access: "write", Subject: "user", SubjectID: currentUser, EnvironmentID: input.EnvironmentID},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return nil, errors.New("Requires permissions.")
	}

	secretData := models.Secrets{
		Secret:        input.Secret,
		SecretType:    "custom",
		Description:   input.Description,
		EnvVar:        input.EnvVar,
		Active:        true,
		EnvironmentID: input.EnvironmentID,
	}

	if input.Value != nil {
		secretData.Value = *input.Value
	}

	err := database.DBConn.Create(&secretData).Error

	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("Create secret database error.")
	}

	return &secretData, nil
}

func (r *mutationResolver) UpdateSecret(ctx context.Context, input *privategraphql.AddSecretsInput) (*models.Secrets, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Resource: "admin_platform", ResourceID: platformID, Access: "write", Subject: "user", SubjectID: currentUser, EnvironmentID: "d_platform"},
		{Resource: "admin_environment", ResourceID: input.EnvironmentID, Access: "write", Subject: "user", SubjectID: currentUser, EnvironmentID: input.EnvironmentID},
		{Resource: "environment_secrets", ResourceID: input.EnvironmentID, Access: "write", Subject: "user", SubjectID: currentUser, EnvironmentID: input.EnvironmentID},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return nil, errors.New("Requires permissions.")
	}

	secretData := models.Secrets{
		Secret:     input.Secret,
		SecretType: "custom",
		// Value:       *input.Value,
		Description: input.Description,
		EnvVar:      input.EnvVar,
		Active:      true,
	}

	if input.Value != nil {
		secretData.Value = *input.Value
	}

	err := database.DBConn.Where("secret = ?", input.Secret).Updates(&secretData).Error

	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("Update secret database error.")
	}

	return &secretData, nil
}

func (r *mutationResolver) UpdateDeleteSecret(ctx context.Context, secret string, environmentID string) (*string, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Resource: "admin_platform", ResourceID: platformID, Access: "write", Subject: "user", SubjectID: currentUser, EnvironmentID: "d_platform"},
		{Resource: "admin_environment", ResourceID: environmentID, Access: "write", Subject: "user", SubjectID: currentUser, EnvironmentID: environmentID},
		{Resource: "environment_secrets", ResourceID: environmentID, Access: "write", Subject: "user", SubjectID: currentUser, EnvironmentID: environmentID},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return nil, errors.New("Requires permissions.")
	}

	s := models.Secrets{}

	err := database.DBConn.Where(&models.Secrets{Secret: secret}).Delete(&s).Error

	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("Delete secret database error.")
	}

	response := "Secret deleted"
	return &response, nil
}

func (r *queryResolver) GetSecret(ctx context.Context, secret string, environmentID string) (*models.Secrets, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Resource: "admin_platform", ResourceID: platformID, Access: "write", Subject: "user", SubjectID: currentUser, EnvironmentID: "d_platform"},
		{Resource: "admin_environment", ResourceID: environmentID, Access: "write", Subject: "user", SubjectID: currentUser, EnvironmentID: environmentID},
		{Resource: "environment_secrets", ResourceID: environmentID, Access: "write", Subject: "user", SubjectID: currentUser, EnvironmentID: environmentID},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return nil, errors.New("Requires permissions.")
	}

	s := models.Secrets{}

	err := database.DBConn.Where("secret = ?", secret).First(&s).Error
	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("Retrive secret database error.")
	}
	return &s, nil
}

func (r *queryResolver) GetSecrets(ctx context.Context, environmentID string) ([]*models.Secrets, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Resource: "admin_platform", ResourceID: platformID, Access: "write", Subject: "user", SubjectID: currentUser, EnvironmentID: "d_platform"},
		{Resource: "admin_environment", ResourceID: environmentID, Access: "write", Subject: "user", SubjectID: currentUser, EnvironmentID: environmentID},
		{Resource: "environment_secrets", ResourceID: environmentID, Access: "write", Subject: "user", SubjectID: currentUser, EnvironmentID: environmentID},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return nil, errors.New("Requires permissions.")
	}

	s := []*models.Secrets{}

	err := database.DBConn.Find(&s).Error
	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("Retrive secrets database error.")
	}
	return s, nil
}
