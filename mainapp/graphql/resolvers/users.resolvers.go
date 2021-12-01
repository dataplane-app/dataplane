package resolvers

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"context"
	"dataplane/database"
	"dataplane/database/models"
	"dataplane/graphql/generated"
	"dataplane/graphql/model"

	"github.com/google/uuid"
)

func (r *mutationResolver) CreateUser(ctx context.Context, input *model.AddUsersInput) (*models.Users, error) {
	userData := models.Users{
		UserID:    uuid.New().String(),
		FirstName: input.FirstName,
		LastName:  input.LastName,
		Password:  input.Password,
		Email:     input.Email,
		Timezone:  input.Timezone,
		Username:  input.UserName,
	}
	err := database.DBConn.Create(userData).Error
	if err != nil {
		return nil, err
	}
	return &models.Users{UserID: userData.UserID}, nil
}

// Mutation returns generated.MutationResolver implementation.
func (r *Resolver) Mutation() generated.MutationResolver { return &mutationResolver{r} }

type mutationResolver struct{ *Resolver }
