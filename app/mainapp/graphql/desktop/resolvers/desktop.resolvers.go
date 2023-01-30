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

// GetRemoteWorkersProcessGroups is the resolver for the getRemoteWorkersProcessGroups field.
func (r *queryResolver) GetRemoteWorkersProcessGroups(ctx context.Context, environmentID string, workerID string) ([]*desktopgraphql.RemoteWorkersProcessGroups, error) {
	var resp []*desktopgraphql.RemoteWorkersProcessGroups

	// Raw query returns process groups that are attached to the environment
	// the user has access to for the given worker group
	err := database.DBConn.Raw(
		`
		select 
		distinct rpg.remote_process_group_id,
		rpg.name,
		rpg.description,
		rpg.packages,
		rpg.language,
		rpg.lb,
		rpg.worker_type,
		rpg.active,
		rwe.environment_id
		from remote_process_groups rpg 
		inner join remote_worker_environments rwe on rpg.remote_process_group_id = rwe.remote_process_group_id 
		inner join environment_user on rwe.environment_id = environment_user.environment_id
		where (rwe.worker_id = ?)
		`, workerID).Find(&resp).Error

	if err != nil && err != gorm.ErrRecordNotFound {
		return nil, errors.New("Remote process groups database error.")
	}

	return resp, nil
}

// Query returns desktopgraphql.QueryResolver implementation.
func (r *Resolver) Query() desktopgraphql.QueryResolver { return &queryResolver{r} }

type queryResolver struct{ *Resolver }
