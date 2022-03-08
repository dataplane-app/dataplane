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
	"dataplane/mainapp/messageq"
	"encoding/json"
	"errors"
	"os"

	"github.com/tidwall/buntdb"
)

func (r *mutationResolver) AddSecretToWorkerGroup(ctx context.Context, environmentName string, workerGroup string, secret string) (*string, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	e := models.Environment{}
	database.DBConn.First(&e, "name = ?", environmentName)

	// ----- Permissions
	perms := []models.Permissions{
		{Resource: "admin_platform", ResourceID: platformID, Access: "write", Subject: "user", SubjectID: currentUser, EnvironmentID: "d_platform"},
		{Resource: "admin_environment", ResourceID: e.ID, Access: "write", Subject: "user", SubjectID: currentUser, EnvironmentID: e.ID},
		{Resource: "environment_secrets", ResourceID: e.ID, Access: "read", Subject: "user", SubjectID: currentUser, EnvironmentID: e.ID},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return nil, errors.New("Requires permissions.")
	}

	workerSecret := models.WorkerSecrets{
		SecretID:      secret,
		WorkerGroupID: workerGroup,
		EnvironmentID: e.ID,
		Active:        true,
	}

	err := database.DBConn.Create(&workerSecret).Error

	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}

		return nil, errors.New("Add secret to worker group database error.")
	}

	// ---- update workers
	errnat := messageq.MsgSend("updatesecrets."+workerGroup, "update")
	if errnat != nil {
		if config.Debug == "true" {
			logging.PrintSecretsRedact(errnat)
		}

	}

	response := "Secret added to work group"
	return &response, nil
}

func (r *mutationResolver) DeleteSecretFromWorkerGroup(ctx context.Context, environmentName string, workerGroup string, secret string) (*string, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	e := models.Environment{}
	database.DBConn.First(&e, "name = ?", environmentName)

	// ----- Permissions
	perms := []models.Permissions{
		{Resource: "admin_platform", ResourceID: platformID, Access: "write", Subject: "user", SubjectID: currentUser, EnvironmentID: "d_platform"},
		{Resource: "admin_environment", ResourceID: e.ID, Access: "write", Subject: "user", SubjectID: currentUser, EnvironmentID: e.ID},
		{Resource: "environment_secrets", ResourceID: e.ID, Access: "read", Subject: "user", SubjectID: currentUser, EnvironmentID: e.ID},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return nil, errors.New("Requires permissions.")
	}

	workerSecret := models.WorkerSecrets{}

	err := database.DBConn.Where(&models.WorkerSecrets{SecretID: secret, WorkerGroupID: workerGroup, EnvironmentID: e.ID}).
		Delete(&workerSecret).Error

	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}

		return nil, errors.New("Remove secret from worker group database error.")
	}

	// ---- update workers
	errnat := messageq.MsgSend("updatesecrets."+workerGroup, "update")
	if errnat != nil {
		if config.Debug == "true" {
			logging.PrintSecretsRedact(errnat)
		}

	}

	response := "Secret removed from work group"
	return &response, nil
}

func (r *queryResolver) GetWorkers(ctx context.Context, environmentID string) ([]*privategraphql.Workers, error) {
	var resp []*privategraphql.Workers
	var worker models.WorkerStats

	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	e := models.Environment{}
	database.DBConn.First(&e, "id = ?", environmentID)

	// ----- Permissions
	perms := []models.Permissions{
		{Resource: "admin_platform", ResourceID: platformID, Access: "write", Subject: "user", SubjectID: currentUser, EnvironmentID: "d_platform"},
		{Resource: "admin_environment", ResourceID: e.ID, Access: "write", Subject: "user", SubjectID: currentUser, EnvironmentID: e.ID},
		{Resource: "environment_view_workers", ResourceID: e.ID, Access: "read", Subject: "user", SubjectID: currentUser, EnvironmentID: e.ID},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return nil, errors.New("Requires permissions.")
	}

	database.GoDBWorker.View(func(tx *buntdb.Tx) error {
		tx.AscendEqual("environment", `{"Env":"`+e.Name+`"}`, func(key, val string) bool {
			// fmt.Printf("Worker Groups: %s %s\n", key, val)

			err := json.Unmarshal([]byte(val), &worker)
			if err != nil {
				logging.PrintSecretsRedact(err)
			}

			resp = append(resp, &privategraphql.Workers{
				WorkerID:    key,
				WorkerGroup: worker.WorkerGroup,
				Status:      worker.Status,
				T:           worker.T,
				Interval:    worker.Interval,
				CPUPerc:     worker.CPUPerc,
				Load:        worker.Load,
				MemoryPerc:  worker.MemoryPerc,
				MemoryUsed:  worker.MemoryUsed,
				Env:         worker.Env,
				Lb:          worker.LB,
				WorkerType:  worker.WorkerType,
			})
			return true
		})
		return nil
	})

	return resp, nil
}

func (r *queryResolver) GetWorkerGroups(ctx context.Context, environmentID string) ([]*privategraphql.WorkerGroup, error) {
	var resp []*privategraphql.WorkerGroup
	var workergroup models.WorkerGroup

	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	e := models.Environment{}
	database.DBConn.First(&e, "id = ?", environmentID)

	// ----- Permissions
	perms := []models.Permissions{
		{Resource: "admin_platform", ResourceID: platformID, Access: "write", Subject: "user", SubjectID: currentUser, EnvironmentID: "d_platform"},
		{Resource: "admin_environment", ResourceID: e.ID, Access: "write", Subject: "user", SubjectID: currentUser, EnvironmentID: e.ID},
		{Resource: "environment_view_workers", ResourceID: e.ID, Access: "read", Subject: "user", SubjectID: currentUser, EnvironmentID: e.ID},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return nil, errors.New("Requires permissions.")
	}

	database.GoDBWorkerGroup.View(func(tx *buntdb.Tx) error {
		tx.AscendEqual("environment", `{"Env":"`+e.Name+`"}`, func(key, val string) bool {
			// fmt.Printf("Worker Groups: %s %s\n", key, val)

			err := json.Unmarshal([]byte(val), &workergroup)
			if err != nil {
				logging.PrintSecretsRedact(err)
			}

			resp = append(resp, &privategraphql.WorkerGroup{
				WorkerGroup: key,
				Status:      workergroup.Status,
				T:           workergroup.T,
				Interval:    workergroup.Interval,
				Env:         workergroup.Env,
				Lb:          workergroup.LB,
				WorkerType:  workergroup.WorkerType,
			})
			return true
		})
		return nil
	})

	return resp, nil
}

func (r *queryResolver) GetSecretGroups(ctx context.Context, environmentID string, secret string) ([]*models.WorkerSecrets, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	e := models.Environment{}
	database.DBConn.First(&e, "id = ?", environmentID)

	// ----- Permissions
	perms := []models.Permissions{
		{Resource: "admin_platform", ResourceID: platformID, Access: "write", Subject: "user", SubjectID: currentUser, EnvironmentID: "d_platform"},
		{Resource: "admin_environment", ResourceID: e.ID, Access: "write", Subject: "user", SubjectID: currentUser, EnvironmentID: e.ID},
		{Resource: "environment_secrets", ResourceID: e.ID, Access: "read", Subject: "user", SubjectID: currentUser, EnvironmentID: e.ID},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return nil, errors.New("Requires permissions.")
	}

	s := []*models.WorkerSecrets{}

	err := database.DBConn.Where("secret_id = ? and environment_id =?", secret, e.ID).Find(&s).Error
	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("Retrive users database error.")
	}

	return s, nil
}

func (r *queryResolver) GetWorkerGroupSecrets(ctx context.Context, environmentID string, workerGroup string) ([]*models.Secrets, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	e := models.Environment{}
	database.DBConn.First(&e, "id = ?", environmentID)

	// ----- Permissions
	perms := []models.Permissions{
		{Resource: "admin_platform", ResourceID: platformID, Access: "write", Subject: "user", SubjectID: currentUser, EnvironmentID: "d_platform"},
		{Resource: "admin_environment", ResourceID: e.ID, Access: "write", Subject: "user", SubjectID: currentUser, EnvironmentID: e.ID},
		{Resource: "environment_secrets", ResourceID: e.ID, Access: "read", Subject: "user", SubjectID: currentUser, EnvironmentID: e.ID},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return nil, errors.New("Requires permissions.")
	}

	s := []*models.Secrets{}

	// err := database.DBConn.Where("worker_group_id = ?", workerGroup).Find(&s).Error

	err := database.DBConn.Raw(
		`
		SELECT 
		secrets.secret,
		secrets.secret_type,
		secrets.description,
		secrets.env_var,
		secrets.active,
        secrets.environment_id    
		FROM secrets
		JOIN worker_secrets
		ON secrets.secret = worker_secrets.secret_id
		WHERE worker_secrets.worker_group_id = ? and secrets.environment_id = ?
		`, workerGroup, e.ID).Scan(&s).Error

	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("Retrive users database error.")
	}

	return s, nil
}
