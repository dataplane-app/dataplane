package publicresolvers

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"context"
	"dataplane/auth"
	"dataplane/database"
	"dataplane/database/models"
	publicgraphql "dataplane/graphql/public"
	"errors"

	"golang.org/x/crypto/bcrypt"
)

func (r *queryResolver) LoginUser(ctx context.Context, username string, password string) (*publicgraphql.Authtoken, error) {
	// check if a user exists
	u := models.Users{}
	if res := database.DBConn.Where(
		&models.Users{Username: username, Active: true},
	).First(&u); res.RowsAffected <= 0 {
		return nil, errors.New("Invalid credentials")
	}

	// Comparing the password with the hash
	if err := bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(password)); err != nil {
		return nil, errors.New("Invalid credentials")
	}

	accessToken, refreshToken := auth.GenerateTokens(u.UserID, u.Username, u.UserType)
	// accessCookie, refreshCookie := auth.GetAuthCookies(accessToken, refreshToken)

	return &publicgraphql.Authtoken{accessToken, refreshToken}, nil
}

// Query returns publicgraphql.QueryResolver implementation.
func (r *Resolver) Query() publicgraphql.QueryResolver { return &queryResolver{r} }

type queryResolver struct{ *Resolver }
