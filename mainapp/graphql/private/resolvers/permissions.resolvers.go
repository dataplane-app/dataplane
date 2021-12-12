package privateresolvers

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"context"
	"dataplane/auth_permissions"
	"dataplane/database"
	"dataplane/database/models"
	"dataplane/logging"
	"errors"
	"os"

	"github.com/google/uuid"
)

func (r *mutationResolver) CreateAccessGroup(ctx context.Context, environmentID string, name string) (string, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Resource: "admin_platform", ResourceID: platformID, Access: "write", Subject: "user", SubjectID: currentUser, EnvironmentID: "d_platform"},
		{Resource: "admin_environment", ResourceID: environmentID, Access: "write", Subject: "user", SubjectID: currentUser, EnvironmentID: environmentID},
		{Resource: "environment_permissions", ResourceID: environmentID, Access: "write", Subject: "user", SubjectID: currentUser, EnvironmentID: environmentID},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return "", errors.New("Requires permissions.")
	}

	e := models.PermissionsAccessGroups{
		AccessGroupID: uuid.New().String(),
		Name:          name,
		EnvironmentID: environmentID,
		Active:        true,
	}

	err := database.DBConn.Create(&e).Error
	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Add access group database error.")
	}

	return e.AccessGroupID, nil
}

func (r *mutationResolver) UpdatePermissionToAccessGroup(ctx context.Context, environmentID string, resource string, resourceID string, access string, accessGroupID string) (string, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Resource: "admin_platform", ResourceID: platformID, Access: "write", Subject: "user", SubjectID: currentUser, EnvironmentID: "d_platform"},
		{Resource: "admin_environment", ResourceID: environmentID, Access: "write", Subject: "user", SubjectID: currentUser, EnvironmentID: environmentID},
		{Resource: "environment_permissions", ResourceID: environmentID, Access: "write", Subject: "user", SubjectID: currentUser, EnvironmentID: environmentID},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return "", errors.New("Requires permissions.")
	}

	perm, err := permissions.CreatePermission(
		"access_group",
		accessGroupID,
		resource,
		resourceID,
		access,
		environmentID,
		false,
	)

	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Add access group permission database error.")
	}

	return perm.ID, nil
}

func (r *mutationResolver) UpdateUserToAccessGroup(ctx context.Context, environmentID string, userID string, accessGroupID string) (string, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Resource: "admin_platform", ResourceID: platformID, Access: "write", Subject: "user", SubjectID: currentUser, EnvironmentID: "d_platform"},
		{Resource: "admin_environment", ResourceID: environmentID, Access: "write", Subject: "user", SubjectID: currentUser, EnvironmentID: environmentID},
		{Resource: "environment_permissions", ResourceID: environmentID, Access: "write", Subject: "user", SubjectID: currentUser, EnvironmentID: environmentID},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return "", errors.New("Requires permissions.")
	}

	e := models.PermissionsAccessGUsers{
		AccessGroupID: accessGroupID,
		UserID:        userID,
		EnvironmentID: environmentID,
		Active:        true,
	}

	err := database.DBConn.Create(&e).Error
	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Add access group database error.")
	}

	return "success", nil
}

func (r *queryResolver) AvailablePermissions(ctx context.Context) ([]*models.ResourceTypeStruct, error) {
	return models.ResourceType, nil
}
