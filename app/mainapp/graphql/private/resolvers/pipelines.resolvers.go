package privateresolvers

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"context"
	permissions "dataplane/mainapp/auth_permissions"
	"dataplane/mainapp/database"
	"dataplane/mainapp/database/models"
	privategraphql "dataplane/mainapp/graphql/private"
	"dataplane/mainapp/logging"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/google/uuid"
)

func (r *mutationResolver) AddPipeline(ctx context.Context, name string, environmentID string, description string) (string, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "platform_environment", ResourceID: platformID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_edit_all_pipelines", ResourceID: platformID, Access: "write", EnvironmentID: environmentID},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return "", errors.New("Requires permissions.")
	}

	e := models.Pipelines{
		PipelineID:    uuid.New().String(),
		Name:          name,
		Description:   description,
		EnvironmentID: environmentID,
		Active:        true,
		Online:        false,
	}

	err := database.DBConn.Create(&e).Error

	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		if strings.Contains(err.Error(), "duplicate key") {
			return "", errors.New("Pipeline already exists.")
		}
		return "", errors.New("Add pipeline database error.")
	}

	rtn := "success"

	return rtn, nil
}

func (r *mutationResolver) AddPipelineFlow(ctx context.Context, input *privategraphql.PipelineFlowInput) (string, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "platform_environment", ResourceID: platformID, Access: "write", EnvironmentID: input.NodesInput.EnvironmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_edit_all_pipelines", ResourceID: platformID, Access: "write", EnvironmentID: input.NodesInput.EnvironmentID},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return "", errors.New("Requires permissions.")
	}

	edgeMeta, err := json.Marshal(input.EdgesInput.Meta)
	if err != nil {
		panic(err)
	}

	edges := models.PipelineEdges{
		EdgeID:        input.EdgesInput.EdgeID,
		PipelineID:    input.EdgesInput.PipelineID,
		From:          input.EdgesInput.From,
		To:            input.EdgesInput.To,
		EnvironmentID: input.EdgesInput.EnvironmentID,
		Meta:          edgeMeta,
		Active:        input.EdgesInput.Active,
	}

	nodeMeta, err := json.Marshal(input.NodesInput.Meta)
	if err != nil {
		panic(err)
	}

	nodes := models.PipelineNodes{
		NodeID:        input.NodesInput.NodeID,
		PipelineID:    input.NodesInput.PipelineID,
		Name:          input.NodesInput.Name,
		EnvironmentID: input.NodesInput.EnvironmentID,
		NodeType:      input.NodesInput.NodeType,
		Description:   input.NodesInput.Description,
		Meta:          nodeMeta,
		Active:        input.NodesInput.Active,
	}

	log.Println(edges, "!!!!!!!!!!!!!!!!!1")
	log.Println(nodes, "!!!!!!!!!!!!!!!!!1")

	return "success", nil
}

func (r *pipelinesResolver) Version(ctx context.Context, obj *models.Pipelines) (string, error) {
	panic(fmt.Errorf("not implemented"))
}

func (r *pipelinesResolver) YAMLHash(ctx context.Context, obj *models.Pipelines) (string, error) {
	panic(fmt.Errorf("not implemented"))
}

func (r *pipelinesResolver) Schedule(ctx context.Context, obj *models.Pipelines) (string, error) {
	panic(fmt.Errorf("not implemented"))
}

func (r *pipelinesResolver) ScheduleType(ctx context.Context, obj *models.Pipelines) (string, error) {
	panic(fmt.Errorf("not implemented"))
}

func (r *queryResolver) GetPipelines(ctx context.Context, environmentID string) ([]*models.Pipelines, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "platform_environment", ResourceID: platformID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_all_pipelines", ResourceID: platformID, Access: "write", EnvironmentID: environmentID},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return nil, errors.New("Requires permissions.")
	}

	p := []*models.Pipelines{}

	err := database.DBConn.Where("environment_id = ?", environmentID).Find(&p).Error

	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("Retrive pipelines database error.")
	}
	return p, nil
}

// Pipelines returns privategraphql.PipelinesResolver implementation.
func (r *Resolver) Pipelines() privategraphql.PipelinesResolver { return &pipelinesResolver{r} }

type pipelinesResolver struct{ *Resolver }
