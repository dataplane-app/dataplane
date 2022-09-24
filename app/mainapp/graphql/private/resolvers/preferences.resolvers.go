package privateresolvers

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"context"
	"errors"
	"log"

	dpconfig "github.com/dataplane-app/dataplane/mainapp/config"

	"github.com/dataplane-app/dataplane/mainapp/database"
	"github.com/dataplane-app/dataplane/mainapp/database/models"
	privategraphql "github.com/dataplane-app/dataplane/mainapp/graphql/private"
	"github.com/dataplane-app/dataplane/mainapp/logging"

	"gorm.io/gorm/clause"
)

func (r *mutationResolver) UpdatePreferences(ctx context.Context, input *privategraphql.AddPreferencesInput) (*string, error) {
	// Retrieve userID from access token
	userID := ctx.Value("currentUser").(string)

	p := &models.Preferences{Preference: input.Preference, Value: input.Value, UserID: userID}

	err := database.DBConn.
		Clauses(clause.OnConflict{UpdateAll: true}).
		Create(&p).Error

	if err != nil {
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("Get preferences database error.")
	}

	response := "Preference updated"
	return &response, nil
}

func (r *queryResolver) GetAllPreferences(ctx context.Context) ([]*privategraphql.Preferences, error) {
	// Retrieve userID from access token
	userID := ctx.Value("currentUser").(string)
	log.Println(userID)
	p := []*privategraphql.Preferences{}

	err := database.DBConn.Where("user_id = ?", userID).Find(&p).Error

	if err != nil {
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact("Get all preferences:", err)
		}
		return nil, errors.New("Get preferences database error.")
	}

	return p, nil
}

func (r *queryResolver) GetOnePreference(ctx context.Context, preference string) (*privategraphql.Preferences, error) {
	// Retrieve userID from access token
	userID := ctx.Value("currentUser").(string)

	p := &privategraphql.Preferences{}

	err := database.DBConn.Where("user_id = ? AND preference = ?", userID, preference).First(&p).Error

	if err != nil {
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact("Get one preference:", err)
		}
		return nil, errors.New("Get preferences database error.")
	}

	return p, nil
}
