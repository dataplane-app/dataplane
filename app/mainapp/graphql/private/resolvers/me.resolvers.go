package privateresolvers

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"context"
	"errors"

	dpconfig "github.com/dataplane-app/dataplane/mainapp/config"

	"github.com/dataplane-app/dataplane/mainapp/auth"
	"github.com/dataplane-app/dataplane/mainapp/database"
	"github.com/dataplane-app/dataplane/mainapp/database/models"
	privategraphql "github.com/dataplane-app/dataplane/mainapp/graphql/private"
	"github.com/dataplane-app/dataplane/mainapp/logging"
)

func (r *mutationResolver) UpdateMe(ctx context.Context, input *privategraphql.AddUpdateMeInput) (*models.Users, error) {
	// Retrieve userID from access token
	userID := ctx.Value("currentUser").(string)

	// Permissions - as logged in user

	u := models.Users{}

	err := database.DBConn.Where("user_id = ?", userID).Updates(models.Users{
		Username:  input.Email,
		FirstName: input.FirstName,
		LastName:  input.LastName,
		Email:     input.Email,
		JobTitle:  input.JobTitle,
		Timezone:  input.Timezone,
	}).First(&u).Error

	if err != nil {
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("updateMe database error.")
	}

	return &models.Users{
		UserID:    u.UserID,
		FirstName: u.FirstName,
		LastName:  u.LastName,
		Email:     u.Email,
		JobTitle:  u.JobTitle,
		Timezone:  u.Timezone,
	}, nil
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
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("database error.")
	}

	response := "success"
	return &response, nil
}

func (r *queryResolver) Me(ctx context.Context) (*models.Users, error) {
	// Retrieve userID from access token
	userID := ctx.Value("currentUser").(string)

	u := models.Users{}

	// Permissions - as logged in user

	err := database.DBConn.Where("user_id = ?", userID).First(&u).Error

	if err != nil {
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("Retrive me database error.")
	}

	return &models.Users{
		UserID:    u.UserID,
		FirstName: u.FirstName,
		LastName:  u.LastName,
		Email:     u.Email,
		JobTitle:  u.JobTitle,
		Timezone:  u.Timezone,
		Status:    u.Status,
		UserType:  u.UserType,
	}, nil
}
