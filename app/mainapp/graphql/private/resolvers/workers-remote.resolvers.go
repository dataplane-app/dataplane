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
	uuid2 "github.com/google/uuid"
	"gorm.io/gorm"
)

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
		Language:    "python",
		Packages:    "",
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

	response := "Success"

	return &response, nil
}

// UpdateRemoteProcessGroup is the resolver for the updateRemoteProcessGroup field.
func (r *mutationResolver) UpdateRemoteProcessGroup(ctx context.Context, id string, environmentID string, name string, language string, packages string, description string, active bool) (*string, error) {
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
		Select("active", "name", "description", "language", "packages").
		Updates(models.RemoteProcessGroups{
			Name:        name,
			Description: description,
			Active:      active,
			Language:    language,
			Packages:    packages,
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
		WorkerID:   id,
		WorkerName: name,
		Status:     "online",
		LB:         "",
		WorkerType: "",
		LastPing:   nil,
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
func (r *mutationResolver) UpdateRemoteWorker(ctx context.Context, workerID string, environmentID string, workerName string, description string, status string, active bool) (*string, error) {
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
		Select("worker_name", "description", "status", "active").
		Updates(models.RemoteWorkers{
			WorkerName:  workerName,
			Description: description,
			Status:      status,
			Active:      active,
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

	err := database.DBConn.Find(&resp).Error

	if err != nil && err != gorm.ErrRecordNotFound {
		return nil, errors.New("Remote process groups database error.")
	}

	return resp, nil
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