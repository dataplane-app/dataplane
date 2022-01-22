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
	"dataplane/utilities"
	"errors"
	"os"
	"regexp"
	"strings"
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

	// Validate secret name
	var isStringAlphaNumeric = regexp.MustCompile(`^[a-zA-Z0-9_]+$`).MatchString
	if !isStringAlphaNumeric(input.Secret) {
		return nil, errors.New("Only [a-z], [A-Z], [0-9] and _ are allowed")
	}

	// Encrypt secret value
	encryptedSecretValue, err := utilities.Encrypt(input.Value)
	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("Secret value encryption failed.")
	}

	secretData := models.Secrets{
		Secret:        input.Secret,
		SecretType:    "custom",
		Value:         encryptedSecretValue,
		Description:   input.Description,
		EnvVar:        "secret_dp_" + strings.ToLower(input.Secret),
		Active:        true,
		EnvironmentID: input.EnvironmentID,
	}

	err = database.DBConn.Create(&secretData).Error

	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}

		if strings.Contains(err.Error(), "duplicate key") {
			return nil, errors.New("Duplicate secret")
		}

		return nil, errors.New("Create secret database error.")
	}

	return &secretData, nil
}

func (r *mutationResolver) UpdateSecret(ctx context.Context, input *privategraphql.UpdateSecretsInput) (*models.Secrets, error) {
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
		SecretType:  "custom",
		Description: input.Description,
		EnvVar:      "secret_dp_" + strings.ToLower(input.Secret),
		Active:      true,
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

func (r *mutationResolver) UpdateSecretValue(ctx context.Context, secret string, value string, environmentID string) (*string, error) {
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

	// Encrypt secret value
	encryptedSecretValue, err := utilities.Encrypt(value)
	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("Secret value encryption failed.")
	}

	secretData := models.Secrets{
		Value: encryptedSecretValue,
	}

	err = database.DBConn.Where("secret = ?", secret).Updates(&secretData).Error

	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("Update secret database error.")
	}

	response := "Secret changed"
	return &response, nil
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

	s.Value = "*****"

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

	// Decrypt secret values
	for i, e := range s {
		if e.SecretType == "custom" {

			s[i].Value = "*****"
		}
	}

	return s, nil
}
