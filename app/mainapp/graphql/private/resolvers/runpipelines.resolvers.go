package privateresolvers

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/dataplane-app/dataplane/mainapp/auth"
	permissions "github.com/dataplane-app/dataplane/mainapp/auth_permissions"
	dpconfig "github.com/dataplane-app/dataplane/mainapp/config"
	"github.com/dataplane-app/dataplane/mainapp/database"
	"github.com/dataplane-app/dataplane/mainapp/database/models"
	privategraphql "github.com/dataplane-app/dataplane/mainapp/graphql/private"
	"github.com/dataplane-app/dataplane/mainapp/logging"
	"github.com/dataplane-app/dataplane/mainapp/pipelines"
	"github.com/dataplane-app/dataplane/mainapp/worker"

	"gorm.io/gorm/clause"
)

func (r *mutationResolver) RunPipelines(ctx context.Context, pipelineID string, environmentID string, runType string, runID string) (*models.PipelineRuns, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "admin_environment", ResourceID: environmentID, Access: "write", EnvironmentID: environmentID},
	}

	switch runType {
	case "pipeline":
		perms = append(perms, models.Permissions{Subject: "user", SubjectID: currentUser, Resource: "environment_run_all_pipelines", ResourceID: platformID, Access: "write", EnvironmentID: environmentID})
		perms = append(perms, models.Permissions{Subject: "user", SubjectID: currentUser, Resource: "specific_pipeline", ResourceID: pipelineID, Access: "run", EnvironmentID: environmentID})
		perms = append(perms, models.Permissions{Subject: "user", SubjectID: currentUser, Resource: "environment_edit_all_pipelines", ResourceID: environmentID, Access: "write", EnvironmentID: environmentID})
	case "deployment":
		perms = append(perms, models.Permissions{Subject: "user", SubjectID: currentUser, Resource: "specific_deployment", ResourceID: pipelineID, Access: "run", EnvironmentID: environmentID})

	}

	permOutcome, outcomes, _, _ := permissions.MultiplePermissionChecks(perms)

	for _, outcome := range outcomes {
		if outcome.Perm.Resource == "environment_edit_all_pipelines" && outcome.Result == "grant" {
			permOutcome = "yes"
		}
	}

	if permOutcome == "denied" {
		return &models.PipelineRuns{}, errors.New("requires permissions")
	}

	var err error
	var resp models.PipelineRuns

	switch runType {
	case "pipeline":
		resp, err = pipelines.RunPipeline(pipelineID, environmentID, runID)
	case "deployment":
		resp, err = pipelines.RunDeployment(pipelineID, environmentID, runID)
	default:
		return &resp, errors.New("Run type not provided.")
	}

	if err != nil {
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}

		return &models.PipelineRuns{}, errors.New("Run pipeline error")
	}

	return &resp, nil
}

func (r *mutationResolver) StopPipelines(ctx context.Context, pipelineID string, runID string, environmentID string, runType string) (*models.PipelineRuns, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "admin_environment", ResourceID: environmentID, Access: "write", EnvironmentID: environmentID},
	}

	switch runType {
	case "pipeline":
		perms = append(perms, models.Permissions{Subject: "user", SubjectID: currentUser, Resource: "environment_run_all_pipelines", ResourceID: platformID, Access: "write", EnvironmentID: environmentID})
		perms = append(perms, models.Permissions{Subject: "user", SubjectID: currentUser, Resource: "specific_pipeline", ResourceID: pipelineID, Access: "run", EnvironmentID: environmentID})
	case "deployment":
		perms = append(perms, models.Permissions{Subject: "user", SubjectID: currentUser, Resource: "specific_deployment", ResourceID: pipelineID, Access: "run", EnvironmentID: environmentID})

	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return &models.PipelineRuns{}, errors.New("requires permissions")
	}

	// Get the run
	var currentRun *models.PipelineRuns
	err3 := database.DBConn.Where("run_id = ? and environment_id = ?", runID, environmentID).First(&currentRun).Error
	if err3 != nil {
		logging.PrintSecretsRedact(err3.Error())
	}

	// Cancel all future tasks
	err := database.DBConn.Model(&models.WorkerTasks{}).Where("run_id = ? and environment_id = ? and status=?", runID, environmentID, "Queue").Updates(map[string]interface{}{"status": "Fail", "reason": "Upstream fail"}).Error
	if err != nil {
		logging.PrintSecretsRedact(err.Error())
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

		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return &models.PipelineRuns{}, err
	}

	return &run, nil
}

func (r *mutationResolver) GeneratePipelineTrigger(ctx context.Context, pipelineID string, environmentID string, triggerID string, apiKeyActive bool, publicLive bool, privateLive bool) (string, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "admin_environment", ResourceID: environmentID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_run_all_pipelines", ResourceID: platformID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "specific_pipeline", ResourceID: pipelineID, Access: "run", EnvironmentID: environmentID},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return "", errors.New("requires permissions")
	}

	trigger := models.PipelineApiTriggers{
		TriggerID:     triggerID,
		PipelineID:    pipelineID,
		EnvironmentID: environmentID,
		APIKeyActive:  apiKeyActive,
		PublicLive:    publicLive,
		PrivateLive:   privateLive,
	}

	err := database.DBConn.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "trigger_id"}},
		DoUpdates: clause.AssignmentColumns([]string{"public_live", "private_live", "api_key_active"}),
	}).Create(&trigger).Error

	if err != nil {
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}

		return "", err
	}

	return "Success", nil
}

func (r *mutationResolver) AddPipelineAPIKey(ctx context.Context, triggerID string, apiKey string, pipelineID string, environmentID string, expiresAt *time.Time) (string, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "admin_environment", ResourceID: environmentID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_run_all_pipelines", ResourceID: platformID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "specific_pipeline", ResourceID: pipelineID, Access: "run", EnvironmentID: environmentID},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return "", errors.New("requires permissions")
	}

	//  Hash API key
	hashedApiKey, err := auth.Encrypt(apiKey)
	if err != nil {
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("unable to hash api key")
	}

	keys := models.PipelineApiKeys{
		TriggerID:     triggerID,
		APIKey:        hashedApiKey,
		APIKeyTail:    strings.Split(apiKey, "-")[3],
		PipelineID:    pipelineID,
		EnvironmentID: environmentID,
		ExpiresAt:     expiresAt,
	}

	err = database.DBConn.Create(&keys).Error
	if err != nil {
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Register database error.")
	}

	return "Success", nil
}

func (r *mutationResolver) DeletePipelineAPIKey(ctx context.Context, apiKey string, pipelineID string, environmentID string) (string, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "admin_environment", ResourceID: environmentID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_run_all_pipelines", ResourceID: platformID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "specific_pipeline", ResourceID: pipelineID, Access: "run", EnvironmentID: environmentID},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return "", errors.New("requires permissions")
	}

	k := models.PipelineApiKeys{}

	query := database.DBConn.Where("pipeline_id = ? and environment_id = ? and api_key = ?",
		pipelineID, environmentID, apiKey).Delete(&k)
	if query.Error != nil {
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(query.Error)
		}
		return "", errors.New("Delete pipeline key database error.")
	}
	if query.RowsAffected == 0 {
		return "", errors.New("Delete pipeline key database error.")
	}

	return "Success", nil
}

func (r *pipelineRunsResolver) RunJSON(ctx context.Context, obj *models.PipelineRuns) (interface{}, error) {
	return obj.RunJSON, nil
}

func (r *queryResolver) PipelineTasksRun(ctx context.Context, pipelineID string, runID string, environmentID string) ([]*privategraphql.WorkerTasks, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "admin_environment", ResourceID: environmentID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_all_pipelines", ResourceID: environmentID, Access: "read", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_run_all_pipelines", ResourceID: platformID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_edit_all_pipelines", ResourceID: environmentID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "specific_pipeline", ResourceID: pipelineID, Access: "run", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "specific_pipeline", ResourceID: pipelineID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "specific_pipeline", ResourceID: pipelineID, Access: "read", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "specific_deployment", ResourceID: pipelineID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "specific_deployment", ResourceID: pipelineID, Access: "read", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "specific_deployment", ResourceID: pipelineID, Access: "run", EnvironmentID: environmentID},
	}

	permOutcome, outcomes, _, _ := permissions.MultiplePermissionChecks(perms)

	for _, outcome := range outcomes {
		if outcome.Perm.Resource == "environment_edit_all_pipelines" && outcome.Result == "grant" {
			permOutcome = "yes"
		}
	}

	for _, outcome := range outcomes {
		if outcome.Perm.Resource == "environment_all_pipelines" && outcome.Result == "grant" {
			permOutcome = "yes"
		}
	}

	if permOutcome == "denied" {
		return nil, errors.New("requires permissions")
	}

	// Get the run
	var currentRun []*privategraphql.WorkerTasks
	err := database.DBConn.Where("run_id = ? and environment_id = ?", runID, environmentID).Find(&currentRun).Error
	if err != nil {
		logging.PrintSecretsRedact(err.Error())
	}

	return currentRun, nil
}

func (r *queryResolver) GetSinglepipelineRun(ctx context.Context, pipelineID string, runID string, environmentID string) (*models.PipelineRuns, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "admin_environment", ResourceID: environmentID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_all_pipelines", ResourceID: environmentID, Access: "read", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_run_all_pipelines", ResourceID: platformID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_edit_all_pipelines", ResourceID: environmentID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "specific_pipeline", ResourceID: pipelineID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "specific_pipeline", ResourceID: pipelineID, Access: "read", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "specific_deployment", ResourceID: pipelineID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "specific_deployment", ResourceID: pipelineID, Access: "read", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "specific_deployment", ResourceID: pipelineID, Access: "run", EnvironmentID: environmentID},
	}

	permOutcome, outcomes, _, _ := permissions.MultiplePermissionChecks(perms)

	for _, outcome := range outcomes {
		if outcome.Perm.Resource == "environment_edit_all_pipelines" && outcome.Result == "grant" {
			permOutcome = "yes"
		}
	}

	for _, outcome := range outcomes {
		if outcome.Perm.Resource == "environment_all_pipelines" && outcome.Result == "grant" {
			permOutcome = "yes"
		}
	}

	if permOutcome == "denied" {
		return nil, errors.New("requires permissions")
	}

	// Get pipeline runs
	var pipelineRun *models.PipelineRuns
	err := database.DBConn.Where("pipeline_id = ? and environment_id = ? and run_id = ?", pipelineID, environmentID, runID).First(&pipelineRun).Error
	if err != nil {
		logging.PrintSecretsRedact(err.Error())
	}

	return pipelineRun, nil
}

func (r *queryResolver) GetPipelineRuns(ctx context.Context, pipelineID string, environmentID string) ([]*models.PipelineRuns, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "admin_environment", ResourceID: environmentID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_all_pipelines", ResourceID: environmentID, Access: "read", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_run_all_pipelines", ResourceID: platformID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_edit_all_pipelines", ResourceID: environmentID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "specific_pipeline", ResourceID: pipelineID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "specific_pipeline", ResourceID: pipelineID, Access: "read", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "specific_pipeline", ResourceID: pipelineID, Access: "run", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "specific_deployment", ResourceID: pipelineID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "specific_deployment", ResourceID: pipelineID, Access: "read", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "specific_deployment", ResourceID: pipelineID, Access: "run", EnvironmentID: environmentID},
	}

	permOutcome, outcomes, _, _ := permissions.MultiplePermissionChecks(perms)

	for _, outcome := range outcomes {
		if outcome.Perm.Resource == "environment_edit_all_pipelines" && outcome.Result == "grant" {
			permOutcome = "yes"
		}
	}

	for _, outcome := range outcomes {
		if outcome.Perm.Resource == "environment_all_pipelines" && outcome.Result == "grant" {
			permOutcome = "yes"
		}
	}

	if permOutcome == "denied" {
		return nil, errors.New("requires permissions")
	}

	// Get pipeline runs
	var pipelineRuns []*models.PipelineRuns
	err := database.DBConn.Select("run_id", "pipeline_id", "status", "environment_id", "run_type", "created_at", "ended_at", "updated_at").Order("created_at desc").Limit(20).Where("pipeline_id = ? and environment_id = ?", pipelineID, environmentID).Find(&pipelineRuns).Error
	if err != nil {
		logging.PrintSecretsRedact(err.Error())
	}

	return pipelineRuns, nil
}

func (r *queryResolver) GetPipelineTrigger(ctx context.Context, pipelineID string, environmentID string) (*models.PipelineApiTriggers, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "admin_environment", ResourceID: environmentID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_run_all_pipelines", ResourceID: platformID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "specific_pipeline", ResourceID: pipelineID, Access: "run", EnvironmentID: environmentID},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return nil, errors.New("requires permissions")
	}

	e := models.PipelineApiTriggers{}

	err := database.DBConn.Where("pipeline_id = ? and environment_id = ?", pipelineID, environmentID).First(&e).Error
	if err != nil {
		if err.Error() == "record not found" {
			return nil, errors.New("record not found")
		}
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("Retrive pipeline trigger database error.")
	}

	return &e, nil
}

func (r *queryResolver) GetPipelineAPIKeys(ctx context.Context, pipelineID string, environmentID string) ([]*models.PipelineApiKeys, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "admin_environment", ResourceID: environmentID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_run_all_pipelines", ResourceID: platformID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "specific_pipeline", ResourceID: pipelineID, Access: "run", EnvironmentID: environmentID},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return nil, errors.New("requires permissions")
	}

	e := []*models.PipelineApiKeys{}

	err := database.DBConn.Where("pipeline_id = ? and environment_id = ?", pipelineID, environmentID).Find(&e).Error
	if err != nil {
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("Retrive pipeline trigger database error.")
	}
	return e, nil
}

// PipelineRuns returns privategraphql.PipelineRunsResolver implementation.
func (r *Resolver) PipelineRuns() privategraphql.PipelineRunsResolver {
	return &pipelineRunsResolver{r}
}

type pipelineRunsResolver struct{ *Resolver }
