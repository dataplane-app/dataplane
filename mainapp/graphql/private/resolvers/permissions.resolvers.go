package privateresolvers

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"context"
	permissions "dataplane/auth_permissions"
	"dataplane/database"
	"dataplane/database/models"
	"dataplane/logging"
	"errors"
	"fmt"
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

func (r *mutationResolver) DeleteAccessGroup(ctx context.Context, accessGroupID string, environmentID string) (string, error) {
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

	// e := models.PermissionsAccessGroups{
	// 	AccessGroupID: accessGroupID,
	// 	EnvironmentID: environmentID,
	// }

	err := database.DBConn.Where("access_group_id =? and environment_id=?", accessGroupID, environmentID).Delete(&models.PermissionsAccessGroups{})

	if err.RowsAffected == 0 {
		return "", errors.New("User to access group relationship not found.")
	}
	if err.Error != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Add access group database error.")
	}

	return accessGroupID, nil
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

func (r *mutationResolver) UpdatePermissionToUser(ctx context.Context, environmentID string, resource string, resourceID string, access string, userID string) (string, error) {
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
		"user",
		userID,
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
		return "", errors.New("Add permission to user database error.")
	}

	return perm.ID, nil
}

func (r *mutationResolver) DeletePermissionToUser(ctx context.Context, userID string, permissionID string, environmentID string) (string, error) {
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

	e := models.Permissions{
		ID:            permissionID,
		SubjectID:     userID,
		EnvironmentID: environmentID,
	}

	err := database.DBConn.Where("id =? and subject_id = ? and environment_id=?", permissionID, userID, environmentID).Delete(&models.Permissions{})

	if err.RowsAffected == 0 {
		return "", errors.New("User to permission relationship not found.")
	}
	if err.Error != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Add access group database error.")
	}

	return e.ID, nil
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

func (r *mutationResolver) RemoveUserFromAccessGroup(ctx context.Context, userID string, accessGroupID string, environmentID string) (string, error) {
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
	}

	err := database.DBConn.Where("access_group_id =? and user_id = ? and environment_id=?", accessGroupID, userID, environmentID).Delete(&models.PermissionsAccessGUsers{})

	if err.RowsAffected == 0 {
		return "", errors.New("User to access group relationship not found.")
	}
	if err.Error != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Add access group database error.")
	}

	return e.AccessGroupID, nil
}

func (r *queryResolver) AvailablePermissions(ctx context.Context) ([]*models.ResourceTypeStruct, error) {
	return models.ResourceType, nil
}

func (r *queryResolver) MyPermissions(ctx context.Context) ([]*models.Permissions, error) {
	panic(fmt.Errorf("not implemented"))
}

func (r *queryResolver) UserPermissions(ctx context.Context, userID string) ([]*models.Permissions, error) {
	panic(fmt.Errorf("not implemented"))
}
