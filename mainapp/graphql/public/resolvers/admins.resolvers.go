package publicresolvers

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"context"
	"dataplane/auth"
	"dataplane/database"
	"dataplane/database/models"
	publicgraphql "dataplane/graphql/public"
	"dataplane/logging"
	"errors"
	"log"
	"os"
	"strings"

	"github.com/google/uuid"
)

func (r *mutationResolver) CreateAdmin(ctx context.Context, input *publicgraphql.AddUsersInput) (*models.Users, error) {
	log.Println("CreateAdmin....")

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
		JobTitle:  input.JobTitle,
		Timezone:  input.Timezone,
		Username:  input.Email,
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
		JobTitle:  userData.JobTitle,
		Timezone:  userData.Timezone,
	}, nil

}

// Mutation returns publicgraphql.MutationResolver implementation.
func (r *Resolver) Mutation() publicgraphql.MutationResolver { return &mutationResolver{r} }

type mutationResolver struct{ *Resolver }
