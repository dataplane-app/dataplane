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
	"os"
	"strings"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
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
		Timezone:  userData.Timezone,
	}, nil
}

func (r *queryResolver) LoginUser(ctx context.Context, username string, password string) (*model.Authtoken, error) {

	// check if a user exists
	u := new(models.Users)
	if res := database.DBConn.Where(
		&models.Users{Username: username},
	).First(&u); res.RowsAffected <= 0 {
		return nil, errors.New("Incorrect password")
	}

	// Comparing the password with the hash
	if err := bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(password)); err != nil {
		return nil, errors.New("Incorrect password")
	}

	accessToken, refreshToken := auth.GenerateTokens(u.UserID)
	// accessCookie, refreshCookie := auth.GetAuthCookies(accessToken, refreshToken)

	return &model.Authtoken{accessToken, refreshToken}, nil
}

func (r *queryResolver) RefreshToken(ctx context.Context, username string, refreshToken string) (*model.Authtoken, error) {
	// To Do: Add validation

	// check if a user exists
	u := new(models.Users)
	if res := database.DBConn.Where(
		&models.Users{Username: username},
	).First(&u); res.RowsAffected <= 0 {
		return nil, errors.New("invalid Credentials")
	}

	accessToken, refreshToken := auth.GenerateTokens(u.UserID)

	return &model.Authtoken{accessToken, refreshToken}, nil
}

// Mutation returns generated.MutationResolver implementation.
func (r *Resolver) Mutation() generated.MutationResolver { return &mutationResolver{r} }

type mutationResolver struct{ *Resolver }
