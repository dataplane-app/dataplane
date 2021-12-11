package privateresolvers

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"context"
	"dataplane/database"
	privategraphql "dataplane/graphql/private"
	"dataplane/logging"
	"errors"
	"os"
)

func (r *mutationResolver) AddPipeline(ctx context.Context, input *privategraphql.AddPipelinesInput) (*string, error) {
	u := privategraphql.Pipelines{
		Name:    input.Name,
		Trigger: input.Trigger,
		// NextRun:   input.NextRun,
		// LastRun:   input.LastRun,
		TotalRuns: input.TotalRuns,
		Status:    input.Status,
		IsOnline:  input.IsOnline,
		// MyDate:    input.MyDate,
	}

	err := database.DBConn.Create(&u).Error

	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("updateMe database error.")
	}

	response := "Pipeline added"
	return &response, nil
}

func (r *queryResolver) GetPipelines(ctx context.Context) ([]*privategraphql.Pipelines, error) {
	p := []*privategraphql.Pipelines{}

	err := database.DBConn.Find(&p).Error

	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("updateMe database error.")
	}

	return p, nil
}
