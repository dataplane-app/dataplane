package privateresolvers

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"context"
	"dataplane/mainapp/auth_permissions"
	"dataplane/mainapp/config"
	"dataplane/mainapp/database"
	"dataplane/mainapp/database/models"
	privategraphql "dataplane/mainapp/graphql/private"
	"dataplane/mainapp/logging"
	"dataplane/mainapp/utilities"
	"encoding/json"
	"errors"
	"os"
	"strings"

	"github.com/google/uuid"
)

func (r *mutationResolver) AddPipeline(ctx context.Context, name string, environmentID string, description string, workerGroup string) (string, error) {
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

	pipelineID := uuid.New().String()

	e := models.Pipelines{
		PipelineID:    pipelineID,
		Name:          name,
		Description:   description,
		EnvironmentID: environmentID,
		WorkerGroup:   workerGroup,
		Active:        true,
		Online:        false,
		UpdateLock:    true,
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

	// Give access permissions for the user who added the pipeline
	AccessTypes := models.AccessTypes

	for _, access := range AccessTypes {
		_, err := permissions.CreatePermission(
			"user",
			currentUser,
			"specific_pipeline",
			pipelineID,
			access,
			environmentID,
			false,
		)

		if err != nil {
			if os.Getenv("debug") == "true" {
				logging.PrintSecretsRedact(err)
			}
			return "", errors.New("Add permission to user database error.")
		}

	}

	return pipelineID, nil
}

func (r *mutationResolver) AddUpdatePipelineFlow(ctx context.Context, input *privategraphql.PipelineFlowInput, environmentID string, pipelineID string) (string, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	var destinations = make(map[string][]string)
	var dependencies = make(map[string][]string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "platform_environment", ResourceID: platformID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_edit_all_pipelines", ResourceID: platformID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "specific_pipeline", ResourceID: pipelineID, Access: "write", EnvironmentID: environmentID},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return "", errors.New("Requires permissions.")
	}

	// ----- lock the pipeline
	err := database.DBConn.Model(&models.Pipelines{}).Where("pipeline_id = ?", pipelineID).Update("update_lock", true).Error
	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}

		return "", errors.New("Update pipeline flow edge database error - failed to lock pipeline")
	}

	// ----- Delete old edges
	edge := models.PipelineEdges{}

	err = database.DBConn.Where("pipeline_id = ?", pipelineID).Delete(&edge).Error
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

		// map out dependencies and destinations
		destinations[p.From] = append(destinations[p.From], p.To)
		dependencies[p.To] = append(dependencies[p.To], p.From)

		// if dependencies[p.To] == []{

		// }

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

		commandJSON, err := json.Marshal(p.Commands)
		if err != nil {
			logging.PrintSecretsRedact(err)
		}

		dependJSON, err := json.Marshal(dependencies[p.NodeID])
		if err != nil {
			logging.PrintSecretsRedact(err)
		}

		destinationJSON, err := json.Marshal(destinations[p.NodeID])
		if err != nil {
			logging.PrintSecretsRedact(err)
		}

		nodes = append(nodes, &models.PipelineNodes{
			NodeID:        p.NodeID,
			PipelineID:    pipelineID,
			Name:          p.Name,
			EnvironmentID: environmentID,
			NodeType:      p.NodeType,
			NodeTypeDesc:  p.NodeTypeDesc,
			WorkerGroup:   p.WorkerGroup,
			Description:   p.Description,
			Commands:      commandJSON,
			Meta:          nodeMeta,
			Dependency:    dependJSON,
			Destination:   destinationJSON,
			Active:        p.Active,
		})

	}

	// Record edges and nodes in database

	var startNode string

	if len(edges) > 0 {

		// ---- test for cycle -----
		// Obtain the first node in the graph
		for _, p := range input.NodesInput {

			if _, ok := dependencies[p.NodeID]; ok {
				//do something here
			} else {
				startNode = p.NodeID
				break
			}
		}

		cycle := utilities.GraphCycleCheck(edges, startNode)
		if cycle == true {
			if config.Debug == "true" {
				logging.PrintSecretsRedact("Cycle detected. Only acyclical pipelines allowed.")
			}
			return "", errors.New("Cycle detected. Only acyclical pipelines allowed.")
		}

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

	// Records original JSON information in database
	JSON, err := json.Marshal(input.JSON)
	if err != nil {
		logging.PrintSecretsRedact(err)
	}

	e := models.Pipelines{
		Json: JSON,
	}

	err = database.DBConn.Where("pipeline_id = ?", pipelineID).Updates(&e).Error

	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Update pipeline database error.")
	}

	// ----- unlock the pipeline
	err = database.DBConn.Model(&models.Pipelines{}).Where("pipeline_id = ?", pipelineID).Update("update_lock", false).Error
	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}

		return "", errors.New("Update pipeline flow edge database error - failed to unlock pipeline")
	}

	return "success", nil
}

func (r *pipelineEdgesResolver) Meta(ctx context.Context, obj *models.PipelineEdges) (interface{}, error) {
	return obj.Meta, nil
}

func (r *pipelineNodesResolver) Commands(ctx context.Context, obj *models.PipelineNodes) (interface{}, error) {
	return obj.Commands, nil
}

func (r *pipelineNodesResolver) Meta(ctx context.Context, obj *models.PipelineNodes) (interface{}, error) {
	return obj.Meta, nil
}

func (r *pipelinesResolver) JSON(ctx context.Context, obj *models.Pipelines) (interface{}, error) {
	return obj.Json, nil
}

func (r *queryResolver) GetPipelines(ctx context.Context, environmentID string) ([]*models.Pipelines, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "platform_environment", ResourceID: platformID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_all_pipelines", ResourceID: platformID, Access: "read", EnvironmentID: environmentID},
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
		{Subject: "user", SubjectID: currentUser, Resource: "specific_pipeline", ResourceID: pipelineID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "specific_pipeline", ResourceID: pipelineID, Access: "read", EnvironmentID: environmentID},
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
