package privateresolvers

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"context"
	"dataplane/auth"
	permissions "dataplane/auth_permissions"
	"dataplane/database"
	"dataplane/database/models"
	privategraphql "dataplane/graphql/private"
	"dataplane/logging"
	"errors"
	"os"
	"strings"

	validator "github.com/go-playground/validator/v10"
	"github.com/google/uuid"
)

func (r *mutationResolver) CreateUser(ctx context.Context, input *privategraphql.AddUsersInput) (*models.Users, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "admin_environment", ResourceID: input.EnvironmentID, Access: "write", EnvironmentID: input.EnvironmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_users", ResourceID: input.EnvironmentID, Access: "write", EnvironmentID: input.EnvironmentID},
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
		Timezone:  input.Timezone,
		Username:  input.Email,
	}

	/* Input validation */
	validate := validator.New()
	err = validate.Struct(userData)
	if err != nil {
		return nil, err
	}

	err = database.DBConn.Create(&userData).Error

	if err != nil {
		if os.Getenv("debug") == "true" {
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
		Timezone:  userData.Timezone,
	}, nil
}

func (r *mutationResolver) UpdateChangePassword(ctx context.Context, input *privategraphql.ChangePasswordInput) (*string, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "admin_environment", ResourceID: input.EnvironmentID, Access: "write", EnvironmentID: input.EnvironmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_users", ResourceID: input.EnvironmentID, Access: "write", EnvironmentID: input.EnvironmentID},
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
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("database error.")
	}

	response := "success"
	return &response, nil
}

func (r *mutationResolver) UpdateDeactivateUser(ctx context.Context, userid string, environmentID string) (*string, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "admin_environment", ResourceID: environmentID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_users", ResourceID: environmentID, Access: "write", EnvironmentID: environmentID},
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
		if os.Getenv("debug") == "true" {
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
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("DeactivateUser database error.")
	}

	response := "User deactivated"
	return &response, nil
}

func (r *mutationResolver) UpdateDeleteUser(ctx context.Context, userid string, environmentID string) (*string, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "admin_environment", ResourceID: environmentID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_users", ResourceID: environmentID, Access: "write", EnvironmentID: environmentID},
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
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("DeleteUser database error.")
	}

	response := "User deleted"
	return &response, nil
}

func (r *mutationResolver) UpdateChangeMyPassword(ctx context.Context, password string) (*string, error) {
	// Permission: logged in user

	userID := ctx.Value("currentUser").(string)

	passwordhashed, err := auth.Encrypt(password)

	if err != nil {
		return nil, errors.New("Password hash failed.")
	}

	err = database.DBConn.Where("user_id = ?", userID).Updates(models.Users{
		Password: passwordhashed,
	}).Error

	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("database error.")
	}

	response := "success"
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
