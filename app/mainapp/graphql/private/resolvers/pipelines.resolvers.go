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

func (r *mutationResolver) AddUpdatePipelineFlow(ctx context.Context, input *privategraphql.PipelineFlowInput, environmentID string, pipelineID string) (string, error) {
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

	// ----- Delete old edges
	edge := models.PipelineEdges{}

	err := database.DBConn.Where("pipeline_id = ?", pipelineID).Delete(&edge).Error
	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}

		return "", errors.New("update pipeline flow edge database error")
	}

	// ----- Add pipeline edges to database

	edges := []*models.PipelineEdges{}

	for _, p := range input.EdgesInput {
		edgeMeta, err := json.Marshal(p.Meta)
		if err != nil {
			logging.PrintSecretsRedact(err)
		}

		edges = append(edges, &models.PipelineEdges{
			EdgeID:        p.EdgeID,
			PipelineID:    pipelineID,
			From:          p.From,
			To:            p.To,
			EnvironmentID: environmentID,
			Meta:          edgeMeta,
			Active:        p.Active,
		})

	}

	if len(edges) > 0 {
		err = database.DBConn.Create(&edges).Error
	}

	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		if strings.Contains(err.Error(), "duplicate key") {
			return "", errors.New("pipeline flow edge already exists")
		}
		return "", errors.New("add pipeline flow edge database error")
	}

	// ----- Delete old nodes
	node := models.PipelineNodes{}

	err = database.DBConn.Where("pipeline_id = ?", pipelineID).Delete(&node).Error
	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}

		return "", errors.New("update pipeline flow edge database error")
	}

	// ----- Add pipeline nodes to database

	nodes := []*models.PipelineNodes{}

	for _, p := range input.NodesInput {
		nodeMeta, err := json.Marshal(p.Meta)
		if err != nil {
			logging.PrintSecretsRedact(err)
		}

		nodes = append(nodes, &models.PipelineNodes{
			NodeID:        p.NodeID,
			PipelineID:    pipelineID,
			Name:          p.Name,
			EnvironmentID: environmentID,
			NodeType:      p.NodeType,
			Description:   p.Description,
			Meta:          nodeMeta,
			Active:        p.Active,
		})

	}

	if len(nodes) > 0 {
		err = database.DBConn.Create(&nodes).Error
	}

	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		if strings.Contains(err.Error(), "duplicate key") {
			return "", errors.New("pipeline flow node already exists")
		}
		return "", errors.New("add pipeline flow node database error")
	}

	return "success", nil
}

func (r *pipelineEdgesResolver) Meta(ctx context.Context, obj *models.PipelineEdges) (interface{}, error) {
	return obj.Meta, nil
}

func (r *pipelineNodesResolver) Meta(ctx context.Context, obj *models.PipelineNodes) (interface{}, error) {
	return obj.Meta, nil
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

func (r *queryResolver) GetPipelineFlow(ctx context.Context, pipelineID string, environmentID string) (*privategraphql.PipelineFlow, error) {
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
		return nil, errors.New("requires permissions")
	}

	// ----- Get pipeline nodes
	nodes := []*models.PipelineNodes{}

	err := database.DBConn.Where("pipeline_id = ?", pipelineID).Find(&nodes).Error

	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("retrive pipeline nodes database error")
	}

	// ----- Get pipeline edges
	edges := []*models.PipelineEdges{}

	err = database.DBConn.Where("pipeline_id = ?", pipelineID).Find(&edges).Error

	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("retrive pipeline edges database error")
	}

	flow := privategraphql.PipelineFlow{
		Edges: edges,
		Nodes: nodes,
	}

	return &flow, nil
}

// PipelineEdges returns privategraphql.PipelineEdgesResolver implementation.
func (r *Resolver) PipelineEdges() privategraphql.PipelineEdgesResolver {
	return &pipelineEdgesResolver{r}
}

// PipelineNodes returns privategraphql.PipelineNodesResolver implementation.
func (r *Resolver) PipelineNodes() privategraphql.PipelineNodesResolver {
	return &pipelineNodesResolver{r}
}

// Pipelines returns privategraphql.PipelinesResolver implementation.
func (r *Resolver) Pipelines() privategraphql.PipelinesResolver { return &pipelinesResolver{r} }

type pipelineEdgesResolver struct{ *Resolver }
type pipelineNodesResolver struct{ *Resolver }
type pipelinesResolver struct{ *Resolver }
