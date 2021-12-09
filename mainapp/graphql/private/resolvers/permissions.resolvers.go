package privateresolvers

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"context"
	"dataplane/database/models"
)

func (r *queryResolver) AvailablePermissions(ctx context.Context) ([]*models.ResourceTypeStruct, error) {
	return models.ResourceType, nil
}
