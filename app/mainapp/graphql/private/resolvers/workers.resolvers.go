package privateresolvers

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"context"
	"errors"

	"github.com/dataplane-app/dataplane/app/mainapp/auth_permissions"
	dpconfig "github.com/dataplane-app/dataplane/app/mainapp/config"
	"github.com/dataplane-app/dataplane/app/mainapp/database"
	"github.com/dataplane-app/dataplane/app/mainapp/database/models"
	privategraphql "github.com/dataplane-app/dataplane/app/mainapp/graphql/private"
	"github.com/dataplane-app/dataplane/app/mainapp/logging"
	"github.com/dataplane-app/dataplane/app/mainapp/messageq"
	"gorm.io/gorm"
)

// AddSecretToWorkerGroup is the resolver for the addSecretToWorkerGroup field.
func (r *mutationResolver) AddSecretToWorkerGroup(ctx context.Context, environmentID string, workerGroup string, secret string) (*string, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Resource: "admin_platform", ResourceID: platformID, Access: "write", Subject: "user", SubjectID: currentUser, EnvironmentID: "d_platform"},
		{Resource: "admin_environment", ResourceID: environmentID, Access: "write", Subject: "user", SubjectID: currentUser, EnvironmentID: environmentID},
		{Resource: "environment_secrets", ResourceID: environmentID, Access: "read", Subject: "user", SubjectID: currentUser, EnvironmentID: environmentID},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return nil, errors.New("Requires permissions.")
	}

	workerSecret := models.WorkerSecrets{
		SecretID:      secret,
		WorkerGroupID: workerGroup,
		EnvironmentID: environmentID,
		Active:        true,
	}

	err := database.DBConn.Create(&workerSecret).Error

	if err != nil {
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}

		return nil, errors.New("Add secret to worker group database error.")
	}

	// ---- update workers
	errnat := messageq.MsgSend("updatesecrets."+workerGroup, "update")
	if errnat != nil {
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(errnat)
		}

	}

	response := "Secret added to work group"
	return &response, nil
}

// DeleteSecretFromWorkerGroup is the resolver for the deleteSecretFromWorkerGroup field.
func (r *mutationResolver) DeleteSecretFromWorkerGroup(ctx context.Context, environmentID string, workerGroup string, secret string) (*string, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Resource: "admin_platform", ResourceID: platformID, Access: "write", Subject: "user", SubjectID: currentUser, EnvironmentID: "d_platform"},
		{Resource: "admin_environment", ResourceID: environmentID, Access: "write", Subject: "user", SubjectID: currentUser, EnvironmentID: environmentID},
		{Resource: "environment_secrets", ResourceID: environmentID, Access: "read", Subject: "user", SubjectID: currentUser, EnvironmentID: environmentID},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return nil, errors.New("Requires permissions.")
	}

	workerSecret := models.WorkerSecrets{}

	err := database.DBConn.Where(&models.WorkerSecrets{SecretID: secret, WorkerGroupID: workerGroup, EnvironmentID: environmentID}).
		Delete(&workerSecret).Error

	if err != nil {
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}

		return nil, errors.New("Remove secret from worker group database error.")
	}

	// ---- update workers
	errnat := messageq.MsgSend("updatesecrets."+workerGroup, "update")
	if errnat != nil {
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(errnat)
		}

	}

	response := "Secret removed from work group"
	return &response, nil
}

// GetWorkers is the resolver for the getWorkers field.
func (r *queryResolver) GetWorkers(ctx context.Context, environmentID string) ([]*privategraphql.Workers, error) {
	var resp []*privategraphql.Workers

	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Resource: "admin_platform", ResourceID: platformID, Access: "write", Subject: "user", SubjectID: currentUser, EnvironmentID: "d_platform"},
		{Resource: "admin_environment", ResourceID: environmentID, Access: "write", Subject: "user", SubjectID: currentUser, EnvironmentID: environmentID},
		{Resource: "environment_view_workers", ResourceID: environmentID, Access: "read", Subject: "user", SubjectID: currentUser, EnvironmentID: environmentID},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return nil, errors.New("Requires permissions.")
	}

	var workers []models.Workers

	err := database.DBConn.Where("environment_id =?", environmentID).Find(&workers).Error
	if err != nil && err != gorm.ErrRecordNotFound {
		return nil, errors.New("Worker groups database error.")
	}

	for _, v := range workers {
		resp = append(resp, &privategraphql.Workers{
			WorkerID:    v.WorkerID,
			WorkerGroup: v.WorkerGroup,
			Status:      v.Status,
			CPUPerc:     v.CPUPerc,
			Load:        v.Load,
			MemoryPerc:  v.MemoryPerc,
			MemoryUsed:  v.MemoryUsed,
			EnvID:       v.EnvironmentID,
			Lb:          v.LB,
			T:           *v.UpdatedAt,
			WorkerType:  v.WorkerType,
		})
	}

	return resp, nil
}

// GetWorkerGroups is the resolver for the getWorkerGroups field.
func (r *queryResolver) GetWorkerGroups(ctx context.Context, environmentID string) ([]*privategraphql.WorkerGroup, error) {
	var resp []*privategraphql.WorkerGroup

	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Resource: "admin_platform", ResourceID: platformID, Access: "write", Subject: "user", SubjectID: currentUser, EnvironmentID: "d_platform"},
		{Resource: "admin_environment", ResourceID: environmentID, Access: "write", Subject: "user", SubjectID: currentUser, EnvironmentID: environmentID},
		{Resource: "environment_view_workers", ResourceID: environmentID, Access: "read", Subject: "user", SubjectID: currentUser, EnvironmentID: environmentID},
		{Resource: "environment_create_pipelines", ResourceID: environmentID, Access: "write", Subject: "user", SubjectID: currentUser, EnvironmentID: environmentID},
		{Resource: "environment_edit_all_pipelines", ResourceID: environmentID, Access: "write", Subject: "user", SubjectID: currentUser, EnvironmentID: environmentID},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return nil, errors.New("Requires permissions.")
	}

	var workerGroups []models.WorkerGroups

	err := database.DBConn.Where("environment_id =?", environmentID).Find(&workerGroups).Error
	if err != nil && err != gorm.ErrRecordNotFound {
		return nil, errors.New("Worker groups database error.")
	}

	for _, v := range workerGroups {
		resp = append(resp, &privategraphql.WorkerGroup{
			WorkerGroup: v.WorkerGroup,
			Status:      "Online",
			Lb:          v.LB,
			T:           *v.UpdatedAt,
			WorkerType:  v.WorkerType,
		})
	}

	return resp, nil
}

// GetSecretGroups is the resolver for the getSecretGroups field.
func (r *queryResolver) GetSecretGroups(ctx context.Context, environmentID string, secret string) ([]*models.WorkerSecrets, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Resource: "admin_platform", ResourceID: platformID, Access: "write", Subject: "user", SubjectID: currentUser, EnvironmentID: "d_platform"},
		{Resource: "admin_environment", ResourceID: environmentID, Access: "write", Subject: "user", SubjectID: currentUser, EnvironmentID: environmentID},
		{Resource: "environment_secrets", ResourceID: environmentID, Access: "read", Subject: "user", SubjectID: currentUser, EnvironmentID: environmentID},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return nil, errors.New("Requires permissions.")
	}

	s := []*models.WorkerSecrets{}

	err := database.DBConn.Where("secret_id = ? and environment_id =?", secret, environmentID).Find(&s).Error
	if err != nil {
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("Retrive users database error.")
	}

	return s, nil
}

// GetWorkerGroupSecrets is the resolver for the getWorkerGroupSecrets field.
func (r *queryResolver) GetWorkerGroupSecrets(ctx context.Context, environmentID string, workerGroup string) ([]*models.Secrets, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Resource: "admin_platform", ResourceID: platformID, Access: "write", Subject: "user", SubjectID: currentUser, EnvironmentID: "d_platform"},
		{Resource: "admin_environment", ResourceID: environmentID, Access: "write", Subject: "user", SubjectID: currentUser, EnvironmentID: environmentID},
		{Resource: "environment_secrets", ResourceID: environmentID, Access: "read", Subject: "user", SubjectID: currentUser, EnvironmentID: environmentID},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return nil, errors.New("Requires permissions.")
	}

	s := []*models.Secrets{}

	// err := database.DBConn.Where("worker_group_id = ?", workerGroup).Find(&s).Error

	err := database.DBConn.Raw(
		`
		SELECT 
		secrets.secret,
		secrets.secret_type,
		secrets.description,
		secrets.env_var,
		secrets.active,
        secrets.environment_id    
		FROM secrets
		JOIN worker_secrets
		ON secrets.secret = worker_secrets.secret_id
		WHERE worker_secrets.worker_group_id = ? and secrets.environment_id = ?
		`, workerGroup, environmentID).Scan(&s).Error

	if err != nil {
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("Retrive users database error.")
	}

	return s, nil
}
