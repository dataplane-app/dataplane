package privateresolvers

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"context"
	"dataplane/mainapp/auth_permissions"
	"dataplane/mainapp/config"
	"dataplane/mainapp/database"
	"dataplane/mainapp/database/models"
	privategraphql "dataplane/mainapp/graphql/private"
	"dataplane/mainapp/logging"
	"dataplane/mainapp/messageq"
	"dataplane/mainapp/utilities"
	"errors"
	"log"
	"regexp"
	"strings"

	"gorm.io/gorm"
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
		if config.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("Secret value encryption failed.")
	}

	secretData := models.Secrets{
		Secret:        input.Secret,
		SecretType:    "custom",
		Value:         encryptedSecretValue,
		Description:   *input.Description,
		EnvVar:        "secret_dp_" + strings.ToLower(input.Secret),
		Active:        true,
		EnvironmentID: input.EnvironmentID,
	}

	err = database.DBConn.Create(&secretData).Error

	if err != nil {
		if config.Debug == "true" {
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
		// SecretType:  "custom",
		Description: *input.Description,
		// EnvVar:      "secret_dp_" + strings.ToLower(input.Secret),
		// Active:      true,
	}

	err := database.DBConn.Where("secret = ? and environment_id = ?", input.Secret, input.EnvironmentID).Select("description").Updates(&secretData).Error

	if err != nil {
		if config.Debug == "true" {
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
		if config.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("Secret value encryption failed.")
	}

	secretData := models.Secrets{
		Value: encryptedSecretValue,
	}

	err = database.DBConn.Where("secret = ? and environment_id = ?", secret, environmentID).Updates(&secretData).Error

	if err != nil {
		if config.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("Update secret database error.")
	}

	// ---- is this secret attached to any workers and if so send an update
	var secretWorkers []string
	if err := database.DBConn.Raw(`
	select
	distinct
	ws.worker_group_id
	from
	secrets s, worker_secrets ws 
	where 
	s.secret = ws.secret_id and
	s.environment_id = ws.environment_id and
	ws.active = true and
	s.active = true and
	s.secret = ? and
	s.environment_id = ? and
	s.secret_type='custom'
	`, secret, environmentID).Scan(&secretWorkers).Error; err != nil {
		if err != gorm.ErrRecordNotFound {
			return nil, errors.New("Update secret database error - couldn't find attached workers.")
		}
	}

	if len(secretWorkers) > 0 {

		for _, x := range secretWorkers {
			// ---- update workers

			log.Println("Send update to worker: ", "updatesecrets."+x)

			errnat := messageq.MsgSend("updatesecrets."+x, "update")
			if errnat != nil {
				if config.Debug == "true" {
					logging.PrintSecretsRedact(errnat)
				}

			}

		}

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

	err := database.DBConn.Where(&models.Secrets{Secret: secret, EnvironmentID: environmentID}).Delete(&s).Error

	if err != nil {
		if config.Debug == "true" {
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

	err := database.DBConn.Where("secret = ? and environment_id =?", secret, environmentID).First(&s).Error
	if err != nil {
		if config.Debug == "true" {
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
		if config.Debug == "true" {
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
