package privateresolvers

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"context"
	permissions "dataplane/mainapp/auth_permissions"
	"dataplane/mainapp/config"
	"dataplane/mainapp/database"
	"dataplane/mainapp/database/models"
	"dataplane/mainapp/logging"
	"dataplane/mainapp/pipelines"
	"dataplane/mainapp/worker"
	"errors"
	"time"
)

func (r *mutationResolver) RunPipelines(ctx context.Context, pipelineID string, environmentID string) (*models.PipelineRuns, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "platform_environment", ResourceID: platformID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_run_all_pipelines", ResourceID: platformID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "specific_pipeline", ResourceID: pipelineID, Access: "run", EnvironmentID: environmentID},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return &models.PipelineRuns{}, errors.New("requires permissions")
	}

	resp, err := pipelines.RunPipeline(pipelineID, environmentID)
	if err != nil {
		if config.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}

		return &models.PipelineRuns{}, errors.New("Run pipeline error")
	}

	return &resp, nil
}

func (r *mutationResolver) StopPipelines(ctx context.Context, pipelineID string, runID string, environmentID string) (*models.PipelineRuns, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "platform_environment", ResourceID: platformID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_run_all_pipelines", ResourceID: platformID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "specific_pipeline", ResourceID: pipelineID, Access: "run", EnvironmentID: environmentID},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return &models.PipelineRuns{}, errors.New("requires permissions")
	}

	// Get the run
	var currentRun *models.PipelineRuns
	err3 := database.DBConn.Where("run_id = ? and environment_id = ?", runID, environmentID, "Queue").First(&currentRun).Error
	if err3 != nil {
		logging.PrintSecretsRedact(err3.Error())
	}

	// Cancel all future tasks
	err := database.DBConn.Model(&models.WorkerTasks{}).Where("run_id = ? and environment_id = ? and status=?", runID, environmentID, "Queue").Updates(map[string]interface{}{"status": "Fail", "reason": "Upstream fail"}).Error
	if err3 != nil {
		logging.PrintSecretsRedact(err3.Error())
	}

	// Get any current running tasks and cancel those tasks
	currentTask := []*models.WorkerTasks{}
	err = database.DBConn.Where("run_id = ? and environment_id = ? and status=?", runID, environmentID, "Run").Find(&currentTask).Error
	if err3 != nil {
		logging.PrintSecretsRedact(err3.Error())
	}

	if len(currentTask) > 0 {
		for _, t := range currentTask {
			errt := worker.WorkerCancelTask(t.TaskID)
			if errt != nil {
				logging.PrintSecretsRedact(errt.Error())
			}
		}
	}
	// Update pipeline as cancelled
	// Create a run
	run := models.PipelineRuns{
		RunID:         runID,
		PipelineID:    pipelineID,
		Status:        "Fail",
		Reason:        "Cancelled by user",
		EnvironmentID: environmentID,
		CreatedAt:     currentRun.CreatedAt,
		EndedAt:       time.Now().UTC(),
	}

	err = database.DBConn.Updates(&run).Error
	if err != nil {

		if config.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return &models.PipelineRuns{}, err
	}

	return &run, nil
}
