package privateresolvers

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"context"
	"dataplane/database"
	privategraphql "dataplane/graphql/private"
	"dataplane/logging"
	"errors"
	"fmt"
	"log"
	"os"
)

func (r *mutationResolver) UpdatePreferences(ctx context.Context, input *privategraphql.AddPreferencesInput) (*string, error) {
	panic(fmt.Errorf("not implemented"))
}

func (r *queryResolver) GetPreferences(ctx context.Context) ([]*privategraphql.Preferences, error) {
	// Retrieve userID from access token
	userID := ctx.Value("currentUser").(string)
	log.Println(userID)
	p := []*privategraphql.Preferences{}

	err := database.DBConn.Where("user_id <> ?", userID).Find(&p).Error

	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("Get preferences database error.")
	}

	return p, nil
}
