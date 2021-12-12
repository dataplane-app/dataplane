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
	"os"
	"strings"

	"github.com/google/uuid"
)

func (r *mutationResolver) RenameEnvironment(ctx context.Context, input *privategraphql.RenameEnvironment) (*models.Environment, error) {

	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	if input.Name == "d_platform" {
		return nil, errors.New("Error - reserved environment name.")
	}

	// Permissions: admin_platform, platform_environment
	c := make(chan permissions.CheckResult)
	resourceTypes := []string{
		"admin_platform",
		"platform_environment",
	}

	for _, resourceType := range resourceTypes {
		// fmt.Println("key: ", k, " - ", url)

		go permissions.PermissionAdminLevel(
			"user",
			currentUser,
			resourceType,
			platformID, "write", c)
	}

	// get the results back
	outcomes := make([]permissions.CheckResult, len(resourceTypes))

	permOuctome := "denied"
	for i, _ := range outcomes {
		outcomes[i] = <-c
		// fmt.Println("key: ", i, " - ", outcomes[i])
		if os.Getenv("debug") == "debug" {
			logging.PrintSecretsRedact("Perms: ", outcomes[i].Perm.Subject, outcomes[i].Result)
		}
		if outcomes[i].Result == "grant" {
			permOuctome = "grant"
			break
		}

	}

	if permOuctome == "denied" {
		return nil, errors.New("Requires permissions.")
	}

	e := models.Environment{}

	err := database.DBConn.Where("id = ?", input.ID).Updates(models.Environment{
		ID:   input.ID,
		Name: input.Name,
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

func (r *mutationResolver) AddEnvironment(ctx context.Context, input *privategraphql.AddEnvironmentInput) (*models.Environment, error) {

	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	if input.Name == "d_platform" {
		return nil, errors.New("Error - reserved environment name.")
	}

	// Permissions: admin_platform, platform_environment
	c := make(chan permissions.CheckResult)
	resourceTypes := []string{
		"admin_platform",
		"platform_environment",
	}

	for _, resourceType := range resourceTypes {
		// fmt.Println("key: ", k, " - ", url)

		go permissions.PermissionAdminLevel(
			"user",
			currentUser,
			resourceType,
			platformID, "write", c)
	}

	// get the results back
	outcomes := make([]permissions.CheckResult, len(resourceTypes))

	permOuctome := "denied"
	for i, _ := range outcomes {
		outcomes[i] = <-c
		// fmt.Println("key: ", i, " - ", outcomes[i])
		if os.Getenv("debug") == "debug" {
			logging.PrintSecretsRedact("Perms: ", outcomes[i].Perm.Subject, outcomes[i].Result)
		}
		if outcomes[i].Result == "grant" {
			permOuctome = "grant"
			break
		}

	}

	if permOuctome == "denied" {
		return nil, errors.New("Requires permissions.")
	}

	e := models.Environment{
		ID:     uuid.New().String(),
		Name:   input.Name,
		Active: true,
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

	return &models.Environment{
		ID:   e.ID,
		Name: e.Name,
	}, nil
}

func (r *queryResolver) GetEnvironments(ctx context.Context) ([]*models.Environment, error) {
	e := []*models.Environment{}

	err := database.DBConn.Find(&e).Error

	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("Retrive me database error.")
	}

	return e, nil
}

// Mutation returns privategraphql.MutationResolver implementation.
func (r *Resolver) Mutation() privategraphql.MutationResolver { return &mutationResolver{r} }

// Query returns privategraphql.QueryResolver implementation.
func (r *Resolver) Query() privategraphql.QueryResolver { return &queryResolver{r} }

type mutationResolver struct{ *Resolver }
type queryResolver struct{ *Resolver }
