package privateresolvers

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"context"
	"dataplane/database"
	"dataplane/database/models"
	"dataplane/logging"
	"errors"
	"os"
)

func (r *queryResolver) Me(ctx context.Context) (*models.Users, error) {
	// Retrieve userID from access token
	userID := ctx.Value("currentUser").(string)

	u := models.Users{}

	err := database.DBConn.Where("user_id = ?", userID).First(&u).Error

	if err != nil {
		if os.Getenv("debug") == "true" {
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
	}, nil
}
