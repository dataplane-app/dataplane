package privateresolvers

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"context"
	permissions "dataplane/auth_permissions"
	"dataplane/database"
	"dataplane/database/models"
	privategraphql "dataplane/graphql/private"
	"dataplane/logging"
	"errors"
	"log"
	"os"
	"os/exec"
	"strings"

	"github.com/google/uuid"
)

func (r *mutationResolver) AddEnvironment(ctx context.Context, input *privategraphql.AddEnvironmentInput) (*models.Environment, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	if input.Name == "d_platform" {
		return nil, errors.New("Error - reserved environment name.")
	}

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "platform_environment", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return nil, errors.New("Requires permissions.")
	}

	// ----- Create the code files directory

	e := models.Environment{
		ID:         uuid.New().String(),
		Name:       input.Name,
		PlatformID: database.PlatformID,
		Active:     true,
	}

	err := database.DBConn.Create(&e).Error

	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		if strings.Contains(err.Error(), "duplicate key") {
			return nil, errors.New("Environment already exists.")
		}
		return nil, errors.New("AddEnvironment database error.")
	}

	log.Println("Create  directory:", os.Getenv("dataplane_code_folder")+e.ID)
	cmd := exec.Command("mkdir", "-p", os.Getenv("dataplane_code_folder")+e.ID)
	// cmd.Env = os.Environ()

	// cmd.Stdout = os.Stdout
	// cmd.Stderr = os.Stderr

	// log.Println(cmd.CombinedOutput())

	log.Println(cmd.Stdout)

	return &models.Environment{
		ID:   e.ID,
		Name: e.Name,
	}, nil
}

func (r *mutationResolver) RenameEnvironment(ctx context.Context, input *privategraphql.RenameEnvironment) (*models.Environment, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	if input.Name == "d_platform" {
		return nil, errors.New("Error - reserved environment name.")
	}

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "platform_environment", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return nil, errors.New("Requires permissions.")
	}

	// ----- Database actions

	e := models.Environment{}

	err := database.DBConn.Where("id = ?", input.ID).Updates(models.Environment{
		ID:         input.ID,
		Name:       input.Name,
		PlatformID: database.PlatformID,
	}).First(&e).Error

	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("Rename environment database error.")
	}

	return &models.Environment{
		ID:   e.ID,
		Name: e.Name,
	}, nil
}

func (r *queryResolver) GetEnvironments(ctx context.Context) ([]*models.Environment, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "platform_environment", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
	}

	_, _, admin, adminEnv := permissions.MultiplePermissionChecks(perms)

	if os.Getenv("debug") == "true" {
		logging.PrintSecretsRedact("Permissions admin: ", admin, adminEnv)
	}

	e := []*models.Environment{}
	if admin == "yes" || adminEnv == "yes" {

		err := database.DBConn.Where("platform_id=?", platformID).Find(&e).Error

		if err != nil {
			if os.Getenv("debug") == "true" {
				logging.PrintSecretsRedact(err)
			}
			return nil, errors.New("Retrive me database error.")
		}
	} else {

		database.DBConn.Raw(
			`select 
			environment.id, 
			environment.name, 
			environment.platform_id
			from 
			environment inner join environment_user 
			on environment.id = environment_user.environment_id
			where 
			environment.active=true and
			environment_user.user_id=? and
			environment.platform_id=?

	`,
			currentUser,
			platformID,
		).Scan(
			&e,
		)

	}

	return e, nil
}

// Mutation returns privategraphql.MutationResolver implementation.
func (r *Resolver) Mutation() privategraphql.MutationResolver { return &mutationResolver{r} }

// Query returns privategraphql.QueryResolver implementation.
func (r *Resolver) Query() privategraphql.QueryResolver { return &queryResolver{r} }

type mutationResolver struct{ *Resolver }
type queryResolver struct{ *Resolver }
