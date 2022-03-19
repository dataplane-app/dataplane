package privateresolvers

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"context"
	permissions "dataplane/mainapp/auth_permissions"
	"dataplane/mainapp/config"
	"dataplane/mainapp/database"
	"dataplane/mainapp/database/models"
	"dataplane/mainapp/filesystem"
	privategraphql "dataplane/mainapp/graphql/private"
	"dataplane/mainapp/logging"
	"errors"
	"log"
	"os"
	"strings"

	"github.com/google/uuid"
	"gorm.io/gorm/clause"
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
		ID:          uuid.New().String(),
		Name:        input.Name,
		Description: *input.Description,
		PlatformID:  config.PlatformID,
		Active:      true,
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

	var parentfolder models.CodeFolders
	database.DBConn.Where("level = ?", "platform").First(&parentfolder)

	// Create folder structure for environment
	dir := models.CodeFolders{
		EnvironmentID: e.ID,
		ParentID:      parentfolder.FolderID,
		FolderName:    e.Name,
		Level:         "environment",
		FType:         "folder",
		Active:        true,
	}

	// Should create a directory as follows code_directory/
	pfolder, _ := filesystem.FolderConstructByID(parentfolder.FolderID)
	filesystem.CreateFolder(dir, pfolder)

	if config.Debug == "true" {
		log.Println("Environment dir created.")
	}

	return &models.Environment{
		ID:          e.ID,
		Name:        e.Name,
		Description: e.Description,
	}, nil
}

func (r *mutationResolver) UpdateEnvironment(ctx context.Context, input *privategraphql.UpdateEnvironment) (*models.Environment, error) {
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
		ID:          input.ID,
		Name:        input.Name,
		Description: *input.Description,
		PlatformID:  config.PlatformID,
	}).First(&e).Error

	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("Rename environment database error.")
	}

	// Update folder structure for environment
	var parentfolder models.CodeFolders
	database.DBConn.Where("level = ?", "platform").First(&parentfolder)

	pfolder, _ := filesystem.FolderConstructByID(parentfolder.FolderID)

	var oldfolder models.CodeFolders
	database.DBConn.Where("environment_id = ? and level = ?", input.ID, "environment").First(&oldfolder)

	OLDinput := models.CodeFolders{
		EnvironmentID: oldfolder.EnvironmentID,
		ParentID:      parentfolder.FolderID,
		FolderName:    oldfolder.FolderName,
		Level:         "environment",
		FType:         "folder",
		Active:        true,
	}

	Newinput := models.CodeFolders{
		EnvironmentID: oldfolder.EnvironmentID,
		ParentID:      parentfolder.FolderID,
		FolderName:    input.Name,
		Level:         "environment",
		FType:         "folder",
		Active:        true,
	}
	filesystem.UpdateFolder(oldfolder.FolderID, OLDinput, Newinput, pfolder)

	return &models.Environment{
		ID:          e.ID,
		Name:        e.Name,
		Description: e.Description,
	}, nil
}

func (r *mutationResolver) UpdateDeactivateEnvironment(ctx context.Context, environmentID string) (*string, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "platform_manage_users", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return nil, errors.New("Requires permissions.")
	}

	// Check if environment is alredy inactive
	e := models.Environment{}

	err := database.DBConn.Where("id = ?", environmentID).First(&e).Error

	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("Deactivate environment database error.")
	}

	if e.Active == false {
		return nil, errors.New("Environment is already inactive.")
	}

	// Deactivate environment
	err = database.DBConn.Where(&models.Environment{ID: environmentID}).Select("active").
		Updates(models.Environment{Active: false}).Error

	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("DeactivateEnvironment database error.")
	}

	response := "Environment deactivated"
	return &response, nil
}

func (r *mutationResolver) UpdateActivateEnvironment(ctx context.Context, environmentID string) (*string, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "platform_manage_users", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return nil, errors.New("Requires permissions.")
	}

	// Check if environment is alredy active
	e := models.Environment{}

	err := database.DBConn.Where("id = ?", environmentID).First(&e).Error

	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("Activate environment database error.")
	}

	if e.Active == true {
		return nil, errors.New("Environment is already active.")
	}

	// Activate environment
	err = database.DBConn.Where(&models.Environment{ID: environmentID}).Select("active").
		Updates(models.Environment{Active: true}).Error

	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("ActivateEnvironment database error.")
	}

	response := "Environment activated"
	return &response, nil
}

func (r *mutationResolver) UpdateDeleteEnvironment(ctx context.Context, environmentID string) (*string, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "platform_manage_users", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return nil, errors.New("Requires permissions.")
	}

	e := models.Environment{}

	err := database.DBConn.Where("id = ?", environmentID).Delete(&e).Error

	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("DeleteEnvironment database error.")
	}

	response := "Environment deleted"
	return &response, nil
}

func (r *mutationResolver) UpdatePlatform(ctx context.Context, input *privategraphql.UpdatePlatformInput) (*string, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return nil, errors.New("Requires permissions.")
	}

	err := database.DBConn.Updates(models.Platform{
		ID:           input.ID,
		BusinessName: input.BusinessName,
		Timezone:     input.Timezone,
		Complete:     input.Complete,
	}).Error

	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("update platform database error")
	}

	response := "Platform updated"
	return &response, nil
}

func (r *mutationResolver) AddUserToEnvironment(ctx context.Context, userID string, environmentID string) (*string, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "admin_environment", ResourceID: environmentID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_add_user", ResourceID: environmentID, Access: "write", EnvironmentID: environmentID},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return nil, errors.New("Requires permissions.")
	}

	e := models.EnvironmentUser{
		EnvironmentID: environmentID,
		UserID:        userID,
		Active:        true,
	}

	err := database.DBConn.Clauses(clause.OnConflict{DoNothing: true}).Create(&e).Error

	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("Add user to environment error.")
	}

	rtn := "success"

	return &rtn, nil
}

func (r *mutationResolver) RemoveUserFromEnvironment(ctx context.Context, userID string, environmentID string) (*string, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "admin_environment", ResourceID: environmentID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_remove_user", ResourceID: environmentID, Access: "write", EnvironmentID: environmentID},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return nil, errors.New("Requires permissions.")
	}

	err := database.DBConn.Where("environment_id=? and user_id=?", environmentID, userID).Delete(&models.EnvironmentUser{}).Error

	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("Remove user from environment error.")
	}

	rtn := "success"

	return &rtn, nil
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

	// if os.Getenv("debug") == "true" {
	// 	logging.PrintSecretsRedact("Permissions admin: ", admin, adminEnv)
	// }

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
			environment.description,
			environment.active,
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

func (r *queryResolver) GetEnvironment(ctx context.Context, environmentID string) (*models.Environment, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "platform_environment", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
	}

	_, _, admin, adminEnv := permissions.MultiplePermissionChecks(perms)

	// if os.Getenv("debug") == "true" {
	// 	logging.PrintSecretsRedact("Permissions admin: ", admin, adminEnv)
	// }

	e := models.Environment{}
	if admin == "yes" || adminEnv == "yes" {

		err := database.DBConn.Where("id=?", environmentID).Find(&e).Error

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
			environment.description,
			environment.active,
			environment.platform_id
			from
			environment inner join environment_user 
			on environment.id = environment_user.environment_id
			where 
			environment.id=?

	`,
			environmentID,
		).Scan(
			&e,
		)

	}

	return &e, nil
}

func (r *queryResolver) GetUserEnvironments(ctx context.Context, userID string, environmentID string) ([]*models.Environment, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	perms := []models.Permissions{
		{Resource: "admin_platform", ResourceID: platformID, Access: "write", Subject: "user", SubjectID: currentUser, EnvironmentID: "d_platform"},
		{Resource: "admin_environment", ResourceID: environmentID, Access: "write", Subject: "user", SubjectID: currentUser, EnvironmentID: environmentID},
		{Resource: "environment_permissions", ResourceID: environmentID, Access: "write", Subject: "user", SubjectID: currentUser, EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_add_user", ResourceID: environmentID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_remove_user", ResourceID: environmentID, Access: "write", EnvironmentID: environmentID},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return nil, errors.New("Requires permissions.")
	}

	e := []*models.Environment{}

	database.DBConn.Raw(
		`select 
	environment.id, 
	environment.name, 
	environment.platform_id,
	environment.active
	from 
	environment inner join environment_user 
	on environment.id = environment_user.environment_id
	where 
	environment_user.user_id=? and
	environment.platform_id=?

`,
		userID,
		platformID,
	).Scan(
		&e,
	)

	return e, nil
}

func (r *queryResolver) GetPlatform(ctx context.Context) (*privategraphql.Platform, error) {
	p := privategraphql.Platform{}

	err := database.DBConn.First(&p).Error

	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("Retrieve platform database error.")
	}

	return &p, nil
}

// Mutation returns privategraphql.MutationResolver implementation.
func (r *Resolver) Mutation() privategraphql.MutationResolver { return &mutationResolver{r} }

// Query returns privategraphql.QueryResolver implementation.
func (r *Resolver) Query() privategraphql.QueryResolver { return &queryResolver{r} }

type mutationResolver struct{ *Resolver }
type queryResolver struct{ *Resolver }
