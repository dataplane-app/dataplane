package privateresolvers

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"context"
	"errors"
	"log"

	"github.com/dataplane-app/dataplane/app/mainapp/auth_permissions"
	dpconfig "github.com/dataplane-app/dataplane/app/mainapp/config"
	"github.com/dataplane-app/dataplane/app/mainapp/database"
	"github.com/dataplane-app/dataplane/app/mainapp/database/models"
	privategraphql "github.com/dataplane-app/dataplane/app/mainapp/graphql/private"
	"github.com/dataplane-app/dataplane/app/mainapp/logging"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// CreateAccessGroup is the resolver for the createAccessGroup field.
func (r *mutationResolver) CreateAccessGroup(ctx context.Context, environmentID string, name string, description *string) (string, error) {
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

	log.Println(description)
	e := models.PermissionsAccessGroups{
		AccessGroupID: uuid.New().String(),
		Name:          name,
		Description:   *description,
		EnvironmentID: environmentID,
		Active:        true,
	}

	err := database.DBConn.Create(&e).Error
	if err != nil {
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Add access group database error.")
	}

	return e.AccessGroupID, nil
}

// UpdateAccessGroup is the resolver for the updateAccessGroup field.
func (r *mutationResolver) UpdateAccessGroup(ctx context.Context, input *privategraphql.AccessGroupsInput) (string, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)
	environmentID := input.EnvironmentID

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

	err := database.DBConn.Where("access_group_id = ?", input.AccessGroupID).Updates(models.PermissionsAccessGroups{
		Name:          input.Name,
		Description:   input.Description,
		Active:        input.Active,
		EnvironmentID: input.EnvironmentID,
	}).Error

	if err != nil {
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("update user database error")
	}

	response := "success"
	return response, nil
}

// ActivateAccessGroup is the resolver for the activateAccessGroup field.
func (r *mutationResolver) ActivateAccessGroup(ctx context.Context, accessGroupID string, environmentID string) (string, error) {
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

	// Check if access group alredy active
	p := models.PermissionsAccessGroups{}

	err := database.DBConn.Where("access_group_id = ?", accessGroupID).First(&p).Error

	if err != nil {
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Retrive me database error.")
	}

	if p.Active == true {
		return "", errors.New("User is already active.")
	}

	// Activate access group
	err = database.DBConn.Where(&models.PermissionsAccessGroups{AccessGroupID: accessGroupID}).Select("active", false).
		Updates(models.PermissionsAccessGroups{Active: true}).Error

	if err != nil {
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Activate access group database error.")
	}

	// Activate access group user
	err = database.DBConn.Where(&models.PermissionsAccessGUsers{AccessGroupID: accessGroupID}).Select("active", false).
		Updates(models.PermissionsAccessGUsers{Active: true}).Error

	if err != nil {
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Activate access group database error.")
	}

	response := "Access group activated"
	return response, nil
}

// DeactivateAccessGroup is the resolver for the deactivateAccessGroup field.
func (r *mutationResolver) DeactivateAccessGroup(ctx context.Context, accessGroupID string, environmentID string) (string, error) {
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

	// Check if access group alredy inactive
	p := models.PermissionsAccessGroups{}

	err := database.DBConn.Where("access_group_id = ?", accessGroupID).First(&p).Error

	if err != nil {
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Retrive me database error.")
	}

	if p.Active == false {
		return "", errors.New("User is already inactive.")
	}

	// Deactivate access group
	err = database.DBConn.Where(&models.PermissionsAccessGroups{AccessGroupID: accessGroupID}).Select("active", true).
		Updates(models.PermissionsAccessGroups{Active: false}).Error

	if err != nil {
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Deactivate access group database error.")
	}

	// Deactivate access groups users
	err = database.DBConn.Where(&models.PermissionsAccessGUsers{AccessGroupID: accessGroupID}).Select("active", true).
		Updates(models.PermissionsAccessGUsers{Active: false}).Error

	if err != nil {
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Deactivate access group database error.")
	}

	response := "Access group deactivated"
	return response, nil
}

// DeleteAccessGroup is the resolver for the deleteAccessGroup field.
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
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Add access group database error.")
	}

	return accessGroupID, nil
}

// UpdatePermissionToAccessGroup is the resolver for the updatePermissionToAccessGroup field.
func (r *mutationResolver) UpdatePermissionToAccessGroup(ctx context.Context, environmentID string, resource string, resourceID string, access string, accessGroupID string) (string, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	/* Requires admin rights to assign admin rights either at platform or environment level */
	perms := []models.Permissions{}
	// ----- Permissions
	if resource == "admin_platform" || resource == "admin_environment" {
		perms = []models.Permissions{
			{Resource: "admin_platform", ResourceID: platformID, Access: "write", Subject: "user", SubjectID: currentUser, EnvironmentID: "d_platform"},
		}

	} else {
		perms = []models.Permissions{
			{Resource: "admin_platform", ResourceID: platformID, Access: "write", Subject: "user", SubjectID: currentUser, EnvironmentID: "d_platform"},
			{Resource: "admin_environment", ResourceID: environmentID, Access: "write", Subject: "user", SubjectID: currentUser, EnvironmentID: environmentID},
			{Resource: "environment_permissions", ResourceID: environmentID, Access: "write", Subject: "user", SubjectID: currentUser, EnvironmentID: environmentID},
		}

	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	// Check that the access group environment is equal to the environment of the permission being added
	p := models.PermissionsAccessGroups{}

	err := database.DBConn.Where("access_group_id =?", accessGroupID).First(&p).Error
	if err != nil {
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Add access group database error.")
	}

	if p.EnvironmentID != environmentID {
		return "", errors.New("Environment does not match the environment access group belongs.")
	}

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
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Add access group permission database error.")
	}

	return perm.ID, nil
}

// UpdateUserToAccessGroup is the resolver for the updateUserToAccessGroup field.
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

	// Check that the access group environment is equal to the environment being added
	p := models.PermissionsAccessGroups{}

	err := database.DBConn.Where("access_group_id =?", accessGroupID).First(&p).Error
	if err != nil {
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Add access group database error.")
	}

	if p.EnvironmentID != environmentID {
		return "", errors.New("Environment does not match the environment access group belongs.")
	}

	e := models.PermissionsAccessGUsers{
		AccessGroupID: accessGroupID,
		UserID:        userID,
		EnvironmentID: environmentID,
		Active:        true,
	}

	err = database.DBConn.Create(&e).Error
	if err != nil {
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Add access group database error.")
	}

	return "success", nil
}

// RemoveUserFromAccessGroup is the resolver for the removeUserFromAccessGroup field.
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
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Add access group database error.")
	}

	return e.AccessGroupID, nil
}

// GetAccessGroups is the resolver for the getAccessGroups field.
func (r *queryResolver) GetAccessGroups(ctx context.Context, userID string, environmentID string) ([]*models.PermissionsAccessGroups, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "admin_environment", ResourceID: environmentID, Access: "write", EnvironmentID: environmentID},
	}

	// Permissions baked into the SQL query below
	_, _, admin, adminEnv := permissions.MultiplePermissionChecks(perms)

	cUser := models.Users{}

	// Check is user belongs to the environment the request is being made for
	if admin == "yes" || adminEnv == "yes" {
		// admin user skip over check
	} else {
		result := database.DBConn.Raw(
			`
	select
		user_id
    from
        environment_user eu
    where
        eu.environment_id = ?
		and eu.user_id = ?
`, environmentID, currentUser).Find(&cUser)

		if result.Error != nil {
			if dpconfig.Debug == "true" {
				logging.PrintSecretsRedact(result.Error)
			}
			return nil, errors.New("User not part of environment.")
		}
		if cUser.UserID != currentUser {
			return nil, errors.New("User not part of environment.")
		}
	}

	e := []*models.PermissionsAccessGroups{}

	err := database.DBConn.Where("environment_id = ?", environmentID).Find(&e).Error
	if err != nil {
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("Retrive users database error.")
	}
	return e, nil
}

// GetAccessGroup is the resolver for the getAccessGroup field.
func (r *queryResolver) GetAccessGroup(ctx context.Context, userID string, environmentID string, accessGroupID string) (*models.PermissionsAccessGroups, error) {
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
		return nil, errors.New("Requires permissions.")
	}

	e := &models.PermissionsAccessGroups{}

	err := database.DBConn.Where("access_group_id = ? and environment_id =?", accessGroupID, environmentID).First(&e).Error
	if err != nil {
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("Retrive users database error.")
	}
	return e, nil
}

// GetUserAccessGroups is the resolver for the getUserAccessGroups field.
func (r *queryResolver) GetUserAccessGroups(ctx context.Context, userID string, environmentID string) ([]*models.PermissionsAccessGUsersOutput, error) {
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
		return nil, errors.New("Requires permissions.")
	}

	e := []*models.PermissionsAccessGUsersOutput{}

	err := database.DBConn.Raw(

		`
		SELECT
		pagu.access_group_id,
		pag.name,
		pagu.user_id,
		pagu.active,
		pagu.environment_id
		FROM permissions_accessg_users pagu
		JOIN permissions_access_groups pag
		ON pagu.access_group_id = pag.access_group_id
		WHERE pagu.user_id = ? and pag.environment_id =? 
		`, userID, environmentID).Scan(&e).Error

	if err != nil {
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("Retrive users database error.")
	}

	return e, nil
}

// GetAccessGroupUsers is the resolver for the getAccessGroupUsers field.
func (r *queryResolver) GetAccessGroupUsers(ctx context.Context, environmentID string, accessGroupID string) ([]*models.Users, error) {
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
		return nil, errors.New("Requires permissions.")
	}

	e := []*models.Users{}

	err := database.DBConn.Raw(

		`
		SELECT 
		u.user_id,
		u.user_type,
		u.first_name,
		u.last_name,
		u.email,
		u.job_title,
		u.timezone,
		u.status
		FROM users u
		JOIN permissions_accessg_users
		ON u.user_id = permissions_accessg_users.user_id
		WHERE permissions_accessg_users.access_group_id = ?	and permissions_accessg_users.environment_id =?	
		`, accessGroupID, environmentID).Scan(&e).Error

	if err != nil {
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("Retrive users database error.")
	}

	return e, nil
}

// MyAccessGroups is the resolver for the myAccessGroups field.
func (r *queryResolver) MyAccessGroups(ctx context.Context) ([]*models.PermissionsAccessGUsersOutput, error) {
	currentUser := ctx.Value("currentUser").(string)

	var AccessGroupsOutput []*models.PermissionsAccessGUsersOutput

	err := database.DBConn.Raw(

		`
		SELECT
		pagu.access_group_id,
		pag.name,
		pagu.user_id,
		pagu.active,
		pagu.environment_id
		FROM permissions_accessg_users pagu
		JOIN permissions_access_groups pag
		ON pagu.access_group_id = pag.access_group_id
		WHERE pagu.user_id = ?
		`, currentUser).Scan(&AccessGroupsOutput).Error

	if err != nil && err != gorm.ErrRecordNotFound {
		return nil, errors.New("Error retrieving access groups")
	}

	return AccessGroupsOutput, nil
}
