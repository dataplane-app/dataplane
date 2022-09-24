package publicresolvers

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"context"
	"errors"
	"os"
	"strings"

	dpconfig "github.com/dataplane-app/dataplane/mainapp/config"

	"github.com/dataplane-app/dataplane/mainapp/auth"
	permissions "github.com/dataplane-app/dataplane/mainapp/auth_permissions"
	"github.com/dataplane-app/dataplane/mainapp/database"
	"github.com/dataplane-app/dataplane/mainapp/database/models"
	publicgraphql "github.com/dataplane-app/dataplane/mainapp/graphql/public"
	"github.com/dataplane-app/dataplane/mainapp/logging"

	validator "github.com/go-playground/validator/v10"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func (r *mutationResolver) SetupPlatform(ctx context.Context, input *publicgraphql.AddAdminsInput) (*publicgraphql.Admin, error) {
	if os.Getenv("DP_MODE") != "development" {
		return nil, errors.New("Not in development mode.")
	}

	platform := models.Platform{}
	if res := database.DBConn.First(&platform); res.Error == gorm.ErrRecordNotFound {
		return nil, errors.New("Platform ID not found, restart the server.")
	}

	if platform.Complete == true {
		return nil, errors.New("Platform already setup.")
	}

	password, err := auth.Encrypt(input.AddUsersInput.Password)

	if err != nil {
		return nil, errors.New("Password hash failed.")
	}

	platformData := &models.Platform{
		ID:           platform.ID,
		BusinessName: input.PlatformInput.BusinessName,
		Timezone:     input.PlatformInput.Timezone,
		Complete:     true,
	}

	userData := &models.Users{
		UserID:    uuid.New().String(),
		UserType:  "admin",
		FirstName: input.AddUsersInput.FirstName,
		LastName:  input.AddUsersInput.LastName,
		Password:  password,
		Status:    "active",
		Active:    true,
		Email:     input.AddUsersInput.Email,
		JobTitle:  input.AddUsersInput.JobTitle,
		Timezone:  input.AddUsersInput.Timezone,
		Username:  input.AddUsersInput.Email,
	}

	/* Input validation */
	validate := validator.New()
	err = validate.Struct(userData)
	if err != nil {
		return nil, err
	}

	// Platform information gets sent to DB
	err = database.DBConn.Updates(&platformData).Error

	if err != nil {
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		if strings.Contains(err.Error(), "duplicate key") {
			return nil, errors.New("Platform already exists.")
		}
		return nil, errors.New("Register database error.")
	}

	// Admin information gets sent to DB
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

	// Add permissions for admin
	_, err = permissions.CreatePermission(
		"user",
		userData.UserID,
		"admin_platform",
		platformData.ID,
		"write",
		"d_platform",
		true,
	)
	if err != nil {
		logging.PrintSecretsRedact(err)
		errors.New("Failed to create admin permissions.")
	}

	// Preferences get added
	preferences := &models.Preferences{
		UserID:     userData.UserID,
		Preference: "theme",
		Value:      "light_mode",
	}

	err = database.DBConn.Create(&preferences).Error

	if err != nil {
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("Register database error.")
	}

	// pass back authentication
	accessToken, refreshToken := auth.GenerateTokens(userData.UserID, userData.Username, userData.UserType)

	return &publicgraphql.Admin{
		platformData,
		userData,
		&publicgraphql.Authtoken{
			AccessToken:  accessToken,
			RefreshToken: refreshToken,
		},
	}, nil
}

// Mutation returns publicgraphql.MutationResolver implementation.
func (r *Resolver) Mutation() publicgraphql.MutationResolver { return &mutationResolver{r} }

type mutationResolver struct{ *Resolver }
