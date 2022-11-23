package privateresolvers

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/dataplane-app/dataplane/app/mainapp/auth"
	permissions "github.com/dataplane-app/dataplane/app/mainapp/auth_permissions"
	dpconfig "github.com/dataplane-app/dataplane/app/mainapp/config"
	"github.com/dataplane-app/dataplane/app/mainapp/database"
	"github.com/dataplane-app/dataplane/app/mainapp/database/models"
	privategraphql "github.com/dataplane-app/dataplane/app/mainapp/graphql/private"
	"github.com/dataplane-app/dataplane/app/mainapp/logging"
	"github.com/dataplane-app/dataplane/app/mainapp/messageq"
	uuid2 "github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
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

// AddRemoteProcessGroup is the resolver for the addRemoteProcessGroup field.
func (r *mutationResolver) AddRemoteProcessGroup(ctx context.Context, environmentID string, name string, description string) (*string, error) {
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

	// Add process group
	id := uuid2.New().String()
	remoteProcessGroups := models.RemoteProcessGroups{
		ID:          id,
		Name:        name,
		Description: description,
		LB:          "",
		WorkerType:  "",
		Active:      false,
	}

	err := database.DBConn.Create(&remoteProcessGroups).Error

	if err != nil {
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}

		return nil, errors.New("Add remote process group database error.")
	}

	// Attach to an environments
	environment := models.RemotePackages{
		RemoteProcessGroupID: id,
		EnvironmentID:        environmentID,
		Packages:             "",
		Language:             "python",
	}

	err = database.DBConn.Create(&environment).Error

	if err != nil {
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}

		return nil, errors.New("Add remote process group database error.")
	}

	response := "Success"

	return &response, nil
}

// UpdateRemoteProcessGroup is the resolver for the updateRemoteProcessGroup field.
func (r *mutationResolver) UpdateRemoteProcessGroup(ctx context.Context, id string, environmentID string, name string, description string, active bool) (*string, error) {
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

	err := database.DBConn.Where("id = ?", id).
		Select("active", "name", "description").
		Updates(models.RemoteProcessGroups{
			Name:        name,
			Description: description,
			Active:      active,
		}).Error

	if err != nil {
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}

		return nil, errors.New("Add remote process group database error.")
	}

	response := "Success"

	return &response, nil
}

// DeleteRemoteProcessGroup is the resolver for the deleteRemoteProcessGroup field.
func (r *mutationResolver) DeleteRemoteProcessGroup(ctx context.Context, id string, environmentID string) (*string, error) {
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

	err := database.DBConn.Where("id = ?", id).Delete(&models.RemoteProcessGroups{})

	if err.RowsAffected == 0 {
		return nil, errors.New("Remote process group relationship not found.")
	}

	if err.Error != nil {
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("Remote process group database error.")
	}

	response := "Success"

	return &response, nil
}

// AddUpdateRemotePackages is the resolver for the addUpdateRemotePackages field.
func (r *mutationResolver) AddUpdateRemotePackages(ctx context.Context, environmentID string, remoteProcessGroupID string, packages string, language string) (*string, error) {
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

	envPackages := models.RemotePackages{
		RemoteProcessGroupID: remoteProcessGroupID,
		EnvironmentID:        environmentID,
		Packages:             packages,
		Language:             language,
	}

	err := database.DBConn.Clauses(clause.OnConflict{
		UpdateAll: true, // Updates all but primary keys
	}).Create(&envPackages).Error

	if err != nil {
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("Add remote process group database error.")
	}

	response := "Success"

	return &response, nil
}

// DeleteRemotePackage is the resolver for the deleteRemotePackage field.
func (r *mutationResolver) DeleteRemotePackage(ctx context.Context, id string, environmentID string) (*string, error) {
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

	err := database.DBConn.Where("remote_process_group_id = ? and environment_id = ?", id, environmentID).Delete(&models.RemotePackages{})

	if err.RowsAffected == 0 {
		return nil, errors.New("Remote process group relationship not found.")
	}

	if err.Error != nil {
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("Remote process group database error.")
	}

	response := "Success"

	return &response, nil
}

// AddRemoteWorker is the resolver for the addRemoteWorker field.
func (r *mutationResolver) AddRemoteWorker(ctx context.Context, environmentID string, remoteProcessGroupID string, name string) (*string, error) {
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

	// Add process group
	id := uuid2.New().String()
	remoteWorker := models.RemoteWorkers{
		WorkerID:             id,
		RemoteProcessGroupID: remoteProcessGroupID,
		WorkerName:           name,
		Status:               "Online",
		LB:                   "",
		WorkerType:           "",
		LastPing:             nil,
	}

	err := database.DBConn.Create(&remoteWorker).Error

	if err != nil {
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}

		return nil, errors.New("Add remote worker database error.")
	}

	response := "Success"

	return &response, nil
}

// UpdateRemoteWorker is the resolver for the updateRemoteWorker field.
func (r *mutationResolver) UpdateRemoteWorker(ctx context.Context, workerID string, environmentID string, workerName string, status string, active bool) (*string, error) {
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

	err := database.DBConn.Where("worker_id = ?", workerID).
		Select("worker_name", "status", "active").
		Updates(models.RemoteWorkers{
			WorkerName: workerName,
			Status:     status,
			Active:     active,
		})

	if err.RowsAffected == 0 {
		return nil, errors.New("remote worker relationship not found.")
	}

	if err.Error != nil {
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}

		return nil, errors.New("Update remote worker database error.")
	}

	response := "Success"

	return &response, nil
}

// DeleteRemoteWorker is the resolver for the deleteRemoteWorker field.
func (r *mutationResolver) DeleteRemoteWorker(ctx context.Context, workerID string, environmentID string) (*string, error) {
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

	err := database.DBConn.Where("worker_id = ?", workerID).Delete(&models.RemoteWorkers{})

	if err.RowsAffected == 0 {
		return nil, errors.New("Remote worker relationship not found.")
	}

	if err.Error != nil {
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("Remote worker database error.")
	}

	response := "Success"

	return &response, nil
}

// AddRemoteWorkerActivationKey is the resolver for the addRemoteWorkerActivationKey field.
func (r *mutationResolver) AddRemoteWorkerActivationKey(ctx context.Context, workerID string, activationKey string, environmentID string, expiresAt *time.Time) (string, error) {
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
		return "", errors.New("Requires permissions.")
	}

	// Hash Activation key
	hashedActivationKey, err := auth.Encrypt(activationKey)
	if err != nil {
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("unable to hash activation key")
	}

	// Add process group
	remoteActivationKey := models.RemoteWorkerActivationKeys{
		ActivationKey:     hashedActivationKey,
		ActivationKeyTail: strings.Split(activationKey, "-")[3],
		RemoteWorkerID:    workerID,
		ExpiresAt:         expiresAt,
	}

	err = database.DBConn.Create(&remoteActivationKey).Error

	if err != nil {
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}

		return "", errors.New("Add activation key database error.")
	}

	return "Success", nil
}

// DeleteRemoteWorkerActivationKey is the resolver for the deleteRemoteWorkerActivationKey field.
func (r *mutationResolver) DeleteRemoteWorkerActivationKey(ctx context.Context, activationKey string, environmentID string) (string, error) {
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
		return "", errors.New("Requires permissions.")
	}

	key := models.RemoteWorkerActivationKeys{}

	query := database.DBConn.Where("activation_key = ?", activationKey).Delete(&key)
	if query.Error != nil {
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(query.Error)
		}
		return "", errors.New("Delete activation key database error.")
	}
	if query.RowsAffected == 0 {
		return "", errors.New("Delete pipeline key database error.")
	}

	return "Success", nil
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

// GetSingleRemoteProcessGroup is the resolver for the getSingleRemoteProcessGroup field.
func (r *queryResolver) GetSingleRemoteProcessGroup(ctx context.Context, environmentID string, id string) (*privategraphql.RemoteProcessGroups, error) {
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

	var remoteProcessGroup *privategraphql.RemoteProcessGroups

	err := database.DBConn.Where("id = ?", id).Find(&remoteProcessGroup).Error
	if err != nil && err != gorm.ErrRecordNotFound {
		return nil, errors.New("Remote process groups database error.")
	}

	return remoteProcessGroup, nil
}

// GetRemoteProcessGroups is the resolver for the getRemoteProcessGroups field.
func (r *queryResolver) GetRemoteProcessGroups(ctx context.Context, environmentID string) ([]*privategraphql.RemoteProcessGroups, error) {
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

	var resp []*privategraphql.RemoteProcessGroups

	err := database.DBConn.Raw(`
	select 
	rpg.*,
	rp.language
	from remote_process_groups rpg 
	left join remote_packages rp on rpg.id = rp.remote_process_group_id 
	where rp.environment_id = ?
	`, environmentID).Scan(&resp).Error

	if err != nil && err != gorm.ErrRecordNotFound {
		return nil, errors.New("Remote process groups database error.")
	}

	return resp, nil
}

// GetRemotePackages is the resolver for the getRemotePackages field.
func (r *queryResolver) GetRemotePackages(ctx context.Context, environmentID string, id string) ([]*privategraphql.RemotePackages, error) {
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

	var remotePackages []*privategraphql.RemotePackages

	err := database.DBConn.Order("created_at asc").Where("remote_process_group_id = ?", id).Find(&remotePackages).Error

	if err != nil {
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("Retrive users database error.")
	}

	return remotePackages, nil
}

// GetRemoteWorkers is the resolver for the getRemoteWorkers field.
func (r *queryResolver) GetRemoteWorkers(ctx context.Context, environmentID string) ([]*privategraphql.RemoteWorkers, error) {
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

	var resp []*privategraphql.RemoteWorkers

	err := database.DBConn.Find(&resp).Error

	if err != nil && err != gorm.ErrRecordNotFound {
		return nil, errors.New("Remote workers database error.")
	}

	return resp, nil
}

// GetSingleRemoteWorker is the resolver for the getSingleRemoteWorker field.
func (r *queryResolver) GetSingleRemoteWorker(ctx context.Context, environmentID string, workerID string) (*privategraphql.RemoteWorkers, error) {
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

	var remoteWorker *privategraphql.RemoteWorkers

	err := database.DBConn.Where("worker_id = ?", workerID).Find(&remoteWorker).Error
	if err != nil && err != gorm.ErrRecordNotFound {
		return nil, errors.New("Remote worker database error.")
	}

	return remoteWorker, nil
}

// GetRemoteWorkerActivationKeys is the resolver for the getRemoteWorkerActivationKeys field.
func (r *queryResolver) GetRemoteWorkerActivationKeys(ctx context.Context, remoteWorkerID string, environmentID string) ([]*models.RemoteWorkerActivationKeys, error) {
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

	keys := []*models.RemoteWorkerActivationKeys{}

	err := database.DBConn.Where("remote_worker_id = ?", remoteWorkerID).Find(&keys).Error
	if err != nil {
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("Retrive activation keys database error.")
	}
	return keys, nil
}
