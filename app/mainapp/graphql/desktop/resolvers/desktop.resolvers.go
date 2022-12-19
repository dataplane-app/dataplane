package desktopresolvers

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"context"
	"errors"

	"github.com/dataplane-app/dataplane/app/mainapp/database"
	desktopgraphql "github.com/dataplane-app/dataplane/app/mainapp/graphql/desktop"
	"gorm.io/gorm"
)

// GetWorkerEnvironments is the resolver for the getWorkerEnvironments field.
func (r *queryResolver) GetWorkerEnvironments(ctx context.Context, workerID string) ([]*desktopgraphql.Environments, error) {
	var resp []*desktopgraphql.Environments

	// Raw query returns worker group's environments that are active
	err := database.DBConn.Raw(
		`
		select 
		distinct environment.id,
		environment.name,
		environment.description,
		environment.active
		from environment 
		inner join remote_worker_environments rwe on environment.id = rwe.environment_id
		where rwe.worker_id = ? and
		environment.active = 'TRUE'
		`, workerID).Find(&resp).Error

	if err != nil && err != gorm.ErrRecordNotFound {
		return nil, errors.New("Worker enviornments database error.")
	}

	return resp, nil
}

// Query returns desktopgraphql.QueryResolver implementation.
func (r *Resolver) Query() desktopgraphql.QueryResolver { return &queryResolver{r} }

type queryResolver struct{ *Resolver }
