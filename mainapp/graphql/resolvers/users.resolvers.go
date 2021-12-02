package resolvers

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"context"
	passwordExcrypt "dataplane/auth"
	validators "dataplane/auth"
	"dataplane/database"
	"dataplane/database/models"
	"dataplane/graphql/generated"
	"dataplane/graphql/model"
	"encoding/json"
	"errors"
	"log"

	"github.com/google/uuid"
)

func (r *mutationResolver) CreateUser(ctx context.Context, input *model.AddUsersInput) (*models.Users, error) {
	log.Print("hello")

	// u := new(models.Users)

	// if err := ctx.BodyParser(u); err != nil {
	// 	return c.JSON(fiber.Map{
	// 		"error": true,
	// 		"input": "Please review your input",
	// 	})
	// }

	// validate if the email, username and password are in correct format
	e := validators.ValidateRegister(input)
	if e.Err {
		finalJson, _ := json.Marshal(e)
		return nil, errors.New("validation failed" + string(finalJson))
	}

	userData := models.Users{
		UserID:    uuid.New().String(),
		FirstName: input.FirstName,
		LastName:  input.LastName,
		Password:  passwordExcrypt.Encrypt(input.Password),
		Email:     input.Email,
		Timezone:  input.Timezone,
		Username:  input.Username,
	}
	log.Print(userData)

	err := database.DBConn.Create(&userData).Error
	// database.DBConn.Create()

	if err != nil {
		log.Println(err)
		return nil, err
	}

	log.Println("db finished...")

	return &models.Users{
		UserID: userData.UserID}, nil
}

// Mutation returns generated.MutationResolver implementation.
func (r *Resolver) Mutation() generated.MutationResolver { return &mutationResolver{r} }

type mutationResolver struct{ *Resolver }
