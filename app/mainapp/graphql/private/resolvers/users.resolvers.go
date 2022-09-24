package privateresolvers

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"context"
	"errors"
	"strings"

	permissions "github.com/dataplane-app/dataplane/mainapp/auth_permissions"

	dpconfig "github.com/dataplane-app/dataplane/mainapp/config"

	"github.com/dataplane-app/dataplane/mainapp/auth"
	"github.com/dataplane-app/dataplane/mainapp/database"
	"github.com/dataplane-app/dataplane/mainapp/database/models"
	privategraphql "github.com/dataplane-app/dataplane/mainapp/graphql/private"
	"github.com/dataplane-app/dataplane/mainapp/logging"

	validator "github.com/go-playground/validator/v10"
	"github.com/google/uuid"
)

func (r *mutationResolver) CreateUser(ctx context.Context, input *privategraphql.AddUsersInput) (*models.Users, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "platform_manage_users", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return nil, errors.New("Requires permissions.")
	}

	password, err := auth.Encrypt(input.Password)

	if err != nil {
		return nil, errors.New("Password hash failed.")
	}

	userData := models.Users{
		UserID:    uuid.New().String(),
		FirstName: input.FirstName,
		LastName:  input.LastName,
		Password:  password,
		Email:     input.Email,
		Status:    "active",
		Active:    true,
		JobTitle:  input.JobTitle,
		Timezone:  input.Timezone,
		Username:  input.Email,
	}

	// If no timezone provided use the org timezone
	if input.Timezone == "" {
		u := models.Platform{}
		database.DBConn.First(&u)
		userData.Timezone = u.Timezone

	}

	/* Input validation */
	validate := validator.New()
	err = validate.Struct(userData)
	if err != nil {
		return nil, err
	}

	err = database.DBConn.Create(&userData).Error

	if err != nil {
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		if strings.Contains(err.Error(), "duplicate key") {
			return nil, errors.New("User already exists.")
		}
		return nil, errors.New("Register database error.")
	}

	return &models.Users{
		UserID:    userData.UserID,
		FirstName: userData.FirstName,
		LastName:  userData.LastName,
		Email:     userData.Email,
		JobTitle:  userData.JobTitle,
		Timezone:  userData.Timezone,
	}, nil
}

func (r *mutationResolver) UpdateUser(ctx context.Context, input *privategraphql.UpdateUsersInput) (*string, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "platform_manage_users", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return nil, errors.New("Requires permissions.")
	}

	err := database.DBConn.Where("user_id = ?", input.UserID).Updates(models.Users{
		FirstName: input.FirstName,
		LastName:  input.LastName,
		Email:     input.Email,
		JobTitle:  input.JobTitle,
		Timezone:  input.Timezone,
	}).Error

	if err != nil {
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("update user database error")
	}

	response := "success"
	return &response, nil
}

func (r *mutationResolver) UpdateChangePassword(ctx context.Context, input *privategraphql.ChangePasswordInput) (*string, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "platform_manage_users", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return nil, errors.New("Requires permissions.")
	}

	password, err := auth.Encrypt(input.Password)

	if err != nil {
		return nil, errors.New("Password hash failed.")
	}

	err = database.DBConn.Where("user_id = ?", input.UserID).Updates(models.Users{
		Password: password,
	}).Error

	if err != nil {
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("database error.")
	}

	response := "success"
	return &response, nil
}

func (r *mutationResolver) UpdateDeactivateUser(ctx context.Context, userid string) (*string, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "platform_manage_users", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return nil, errors.New("Requires permissions.")
	}

	if currentUser == userid {
		return nil, errors.New("User to be deactivated cannot be the same as logged in user.")
	}
	t := models.AuthRefreshTokens{}
	// We need to remove any access to deactivated user.
	database.DBConn.Where(
		&models.AuthRefreshTokens{UserID: userid},
	).Delete(&t)

	// Check if user alredy inactive
	u := models.Users{}

	err := database.DBConn.Where("user_id = ?", userid).First(&u).Error

	if err != nil {
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("Retrive me database error.")
	}

	if u.Active == false {
		return nil, errors.New("User is already inactive.")
	}

	// Deactivate user
	err = database.DBConn.Where(&models.Users{UserID: userid}).Select("status", "active").
		Updates(models.Users{Status: "inactive", Active: false}).Error

	if err != nil {
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("DeactivateUser database error.")
	}

	response := "User deactivated"
	return &response, nil
}

func (r *mutationResolver) UpdateActivateUser(ctx context.Context, userid string) (*string, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "platform_manage_users", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return nil, errors.New("Requires permissions.")
	}

	if currentUser == userid {
		return nil, errors.New("User to be activated cannot be the same as logged in user.")
	}

	// Check if user alredy active
	u := models.Users{}

	err := database.DBConn.Where("user_id = ?", userid).First(&u).Error

	if err != nil {
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("Retrive user database error.")
	}

	if u.Active == true {
		return nil, errors.New("User is already active.")
	}

	// Activate user
	err = database.DBConn.Where(&models.Users{UserID: userid}).Select("status", "active").
		Updates(models.Users{Status: "active", Active: true}).Error

	if err != nil {
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("ActivateUser database error.")
	}

	response := "User Activated"
	return &response, nil
}

func (r *mutationResolver) UpdateDeleteUser(ctx context.Context, userid string) (*string, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "platform_manage_users", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return nil, errors.New("Requires permissions.")
	}

	if currentUser == userid {
		return nil, errors.New("User to be deleted cannot be the same as logged in user.")
	}
	t := models.AuthRefreshTokens{}

	database.DBConn.Where(
		&models.AuthRefreshTokens{UserID: userid},
	).Delete(&t)

	u := models.Users{}

	err := database.DBConn.Where(&models.Users{UserID: userid}).Delete(&u).Error

	if err != nil {
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("DeleteUser database error.")
	}

	response := "User deleted"
	return &response, nil
}

func (r *queryResolver) LogoutUser(ctx context.Context) (*string, error) {
	// Permission: logged in user

	userID := ctx.Value("currentUser").(string)

	u := models.AuthRefreshTokens{}

	if res := database.DBConn.Where(
		&models.AuthRefreshTokens{UserID: userID},
	).Delete(&u); res.RowsAffected <= 0 {
		return nil, errors.New("Invalid credentials")
	}

	response := "Logged out"
	return &response, nil
}

func (r *queryResolver) GetUser(ctx context.Context, userID string) (*models.Users, error) {
	e := models.Users{}

	err := database.DBConn.Where("user_id = ?", userID).First(&e).Error
	if err != nil {
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("Retrive user database error.")
	}
	return &e, nil
}

func (r *queryResolver) GetUsers(ctx context.Context) ([]*models.Users, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "platform_manage_users", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return nil, errors.New("Requires permissions.")
	}

	e := []*models.Users{}

	err := database.DBConn.Find(&e).Error
	if err != nil {
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("Retrive users database error.")
	}
	return e, nil
}

func (r *queryResolver) GetUsersFromEnvironment(ctx context.Context, environmentID string) ([]*models.Users, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "admin_environment", ResourceID: environmentID, Access: "write", EnvironmentID: environmentID},
	}

	// Permissions baked into the SQL query below
	_, _, admin, adminEnv := permissions.MultiplePermissionChecks(perms)

	e := []*models.Users{}

	if admin == "yes" || adminEnv == "yes" {
		// admin user skip over check
	} else {

		cUser := models.Users{}

		// Check is user belongs to the environment the request is being made for
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

	err := database.DBConn.Raw(
		`
	select
		users.user_id,
        users.user_type,
        users.first_name,
        users.last_name,
        users.email,
        users.job_title,
        users.timezone,
        users.status
    from
        users,
        environment_user eu
    where
        eu.environment_id = ?
        and users.user_id = eu.user_id
`, environmentID).Find(&e).Error
	if err != nil {
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("Retrive users database error.")
	}
	return e, nil
}
