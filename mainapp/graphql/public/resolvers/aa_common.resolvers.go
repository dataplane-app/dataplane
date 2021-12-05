package publicresolvers

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"context"
	publicgraphql "dataplane/graphql/public"
	"fmt"
)

func (r *queryResolver) GetEnvironments(ctx context.Context) ([]*publicgraphql.Environments, error) {
	panic(fmt.Errorf("not implemented"))
}

// Query returns publicgraphql.QueryResolver implementation.
func (r *Resolver) Query() publicgraphql.QueryResolver { return &queryResolver{r} }

type queryResolver struct{ *Resolver }
