package privateresolvers

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"context"
	privategraphql "dataplane/graphql/private"
	"fmt"
)

func (r *queryResolver) GetEnvironments(ctx context.Context) ([]*privategraphql.Environments, error) {
	panic(fmt.Errorf("not implemented"))
}

// Query returns privategraphql.QueryResolver implementation.
func (r *Resolver) Query() privategraphql.QueryResolver { return &queryResolver{r} }

type queryResolver struct{ *Resolver }
