package resolvers

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"context"
	"dataplane/auth"
	"dataplane/database"
	"dataplane/database/models"
	"dataplane/graphql/generated"
	"dataplane/graphql/model"
	"dataplane/logging"
	"encoding/json"
	"errors"
	"fmt"
	"os"

	"github.com/google/uuid"
)

func (r *mutationResolver) CreateUser(ctx context.Context, input *model.AddUsersInput) (*models.Users, error) {
	// validate if the email, username and password are in correct format
	e := auth.ValidateRegister(input)
	if e.Err {
		finalJson, _ := json.Marshal(e)
		return nil, errors.New("validation failed" + string(finalJson))
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
		Timezone:  input.Timezone,
		Username:  input.Username,
	}

	err = database.DBConn.Create(&userData).Error

	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("Register database error.")
	}

	return &models.Users{
		UserID: userData.UserID}, nil
}

func (r *queryResolver) LoginUser(ctx context.Context, username string, password string) (*model.Authtoken, error) {
	panic(fmt.Errorf("not implemented"))
}

// Mutation returns generated.MutationResolver implementation.
func (r *Resolver) Mutation() generated.MutationResolver { return &mutationResolver{r} }

type mutationResolver struct{ *Resolver }
