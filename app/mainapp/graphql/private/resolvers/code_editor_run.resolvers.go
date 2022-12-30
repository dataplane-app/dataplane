package privateresolvers

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"context"
	"errors"
	"log"

	permissions "github.com/dataplane-app/dataplane/app/mainapp/auth_permissions"
	"github.com/dataplane-app/dataplane/app/mainapp/code_editor/runcode"
	dpconfig "github.com/dataplane-app/dataplane/app/mainapp/config"
	"github.com/dataplane-app/dataplane/app/mainapp/database/models"
	privategraphql "github.com/dataplane-app/dataplane/app/mainapp/graphql/private"
	"github.com/dataplane-app/dataplane/app/mainapp/logging"
)

// RunCEFile is the resolver for the runCEFile field.
func (r *mutationResolver) RunCEFile(ctx context.Context, pipelineID string, nodeID string, fileID string, environmentID string, nodeTypeDesc string, workerGroup string, runID string) (*privategraphql.CERun, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// log.Println(workerGroup, nodeTypeDesc)
	switch nodeTypeDesc {
	case "rpa-python":

		/* look up process group */

		// workerGroup = "df5db56d-536a-403f-8ebc-ea819e2c4931"
		log.Println("rpa", workerGroup)
	case "python":
		log.Println("python")
	default:
		return &privategraphql.CERun{}, errors.New("Language type not found.")
	}

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "admin_environment", ResourceID: environmentID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_edit_all_pipelines", ResourceID: platformID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "specific_pipeline", ResourceID: pipelineID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "specific_pipeline", ResourceID: pipelineID, Access: "run", EnvironmentID: environmentID},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return &privategraphql.CERun{}, errors.New("Requires permissions.")
	}

	runData, err := runcode.RunCodeFile(workerGroup, fileID, environmentID, pipelineID, nodeID, nodeTypeDesc, runID)
	if err != nil {
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("Failed to run code.")
	}

	return &privategraphql.CERun{
		RunID:         runData.RunID,
		NodeID:        runData.NodeID,
		FileID:        runData.FileID,
		Status:        runData.Status,
		EnvironmentID: runData.EnvironmentID,
		CreatedAt:     runData.CreatedAt,
		EndedAt:       &runData.EndedAt,
	}, nil
}

// StopCERun is the resolver for the stopCERun field.
func (r *mutationResolver) StopCERun(ctx context.Context, pipelineID string, runID string, environmentID string) (string, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "admin_environment", ResourceID: environmentID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_edit_all_pipelines", ResourceID: platformID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "specific_pipeline", ResourceID: pipelineID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "specific_pipeline", ResourceID: pipelineID, Access: "run", EnvironmentID: environmentID},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return "", errors.New("Requires permissions.")
	}

	err := runcode.RunCodeFileCancel(runID, environmentID)
	if err != nil {
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "fail", errors.New("Failed to cancel code run.")
	}

	return "OK", nil
}
