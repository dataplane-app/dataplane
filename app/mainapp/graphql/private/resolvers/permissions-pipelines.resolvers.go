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
	"errors"
	"fmt"
	"log"
	"os"

	"gorm.io/gorm"
)

func (r *mutationResolver) PipelinePermissionsToUser(ctx context.Context, environmentID string, resource string, resourceID string, access string, userID string, checked string) (string, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "platform_environment", ResourceID: platformID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_edit_all_pipelines", ResourceID: platformID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "specific_pipeline", ResourceID: resourceID, Access: "write", EnvironmentID: environmentID},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return "", errors.New("Requires permissions.")
	}

	if checked == "no" {
		err := database.DBConn.Where("subject_id = ? and resource = ? and resource_id = ? and access = ? and environment_id = ?",
			userID, resource, resourceID, access, environmentID).Delete(&models.Permissions{})

		// Fix below!!!
		log.Println(err)
		// if err != nil {
		// 	if os.Getenv("debug") == "true" {
		// 		logging.PrintSecretsRedact(err)
		// 	}
		// 	return "", errors.New("Delete pipelines permission to user database error.")
		// }

		return "Permission deleted.", nil
	}

	if checked == "yes" {

		perm, err := permissions.UpsertSpecificPermission(
			"user",
			userID,
			resource,
			resourceID,
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

		return perm.ID, nil
	}

	return "", errors.New("Check must be yes or no")
}

func (r *mutationResolver) PipelinePermissionsToAccessGroup(ctx context.Context, environmentID string, resource string, resourceID string, access string, accessGroupID string, checked string) (string, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "platform_environment", ResourceID: platformID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_edit_all_pipelines", ResourceID: platformID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "specific_pipeline", ResourceID: resourceID, Access: "write", EnvironmentID: environmentID},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return "", errors.New("Requires permissions.")
	}

	if checked == "no" {
		err := database.DBConn.Where("subject_id = ? and resource = ? and resource_id = ? and access = ?",
			accessGroupID, resource, resourceID, access).Delete(&models.Permissions{})

		// Fix below!!!
		log.Println(err)
		// if err != nil {
		// 	if os.Getenv("debug") == "true" {
		// 		logging.PrintSecretsRedact(err)
		// 	}
		// 	return "", errors.New("Delete pipelines permission to user database error.")
		// }

		return "Permission deleted.", nil
	}

	if checked == "yes" {

		perm, err := permissions.UpsertSpecificPermission(
			"access_group",
			accessGroupID,
			resource,
			resourceID,
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

		return perm.ID, nil
	}

	return "", errors.New("Check must be yes or no")
}

func (r *queryResolver) MyPipelinePermissions(ctx context.Context) ([]*privategraphql.PipelinePermissionsOutput, error) {
	panic(fmt.Errorf("not implemented"))
}

func (r *queryResolver) UserPipelinePermissions(ctx context.Context, userID string, environmentID string) ([]*privategraphql.PipelinePermissionsOutput, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{

		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "platform_environment", ResourceID: platformID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_edit_all_pipelines", ResourceID: platformID, Access: "write", EnvironmentID: environmentID},
		// {Subject: "user", SubjectID: currentUser, Resource: "specific_pipeline", ResourceID: pipelineID, Access: "assign_pipeline_permission", EnvironmentID: environmentID},
		// {Subject: "user", SubjectID: currentUser, Resource: "specific_pipeline", ResourceID: pipelineID, Access: "read", EnvironmentID: environmentID},
		// {Subject: "user", SubjectID: currentUser, Resource: "specific_pipeline", ResourceID: pipelineID, Access: "write", EnvironmentID: environmentID},
		// {Subject: "user", SubjectID: currentUser, Resource: "specific_pipeline", ResourceID: pipelineID, Access: "run", EnvironmentID: environmentID},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return nil, errors.New("Requires permissions.")
	}

	var PermissionsOutput []*privategraphql.PipelinePermissionsOutput

	err := database.DBConn.Raw(
		`
		(
			select
			  string_agg(p.access, ',') as access,
			  p.subject,
			  p.subject_id,
			  pipelines.name as pipeline_name,
			  p.resource_id,
			  p.environment_id,
			  p.active,
			  pt.level,
			  pt.label,
			  users.first_name,
			  users.last_name,
			  users.email,
			  users.job_title
			from
			  permissions p,
			  permissions_resource_types pt,
			  users,
			  pipelines
			where
			  p.resource = pt.code
			  and pt.level = 'specific'
		  
			  and p.subject = 'user'
			  and p.subject_id = users.user_id
			  and p.subject_id = ?
		  
			  and p.resource_id = pipelines.pipeline_id
		  
			  and p.active = true
		  
			GROUP BY
			  p.subject,
			  p.subject_id,
			  pipelines.name,
			  p.resource_id,
			  p.environment_id,
			  p.active,
			  p.subject_id,
			  pt.level,
			  pt.label,
			  users.first_name,
			  users.last_name,
			  users.email,
			  users.job_title
		  )
		  UNION
			(
			  select
				string_agg(p.access, ',') as access,
				p.subject,
				p.subject_id,
				pipelines.name,
				p.resource_id,
				p.environment_id,
				p.active,
				pt.level,
				pt.label,
				pag.name,
				'',
				'',
				''
			  from
				permissions p,
				permissions_resource_types pt,
				permissions_access_groups pag,
				pipelines
			  where
				p.resource = pt.code
				and pt.level = 'specific'
		  
				and p.subject = 'access_group'
				and p.subject_id = pag.access_group_id
				and p.subject_id = ?
		  
				and p.resource_id = pipelines.pipeline_id
		  
				and p.active = true
				
			  GROUP BY
				p.subject,
				p.subject_id,
				pipelines.name,
				p.resource_id,
				p.environment_id,
				p.active,
				pt.level,
				pt.label,
				pag.name
			)
`,
		//direct
		userID,
		userID,
	).Scan(
		&PermissionsOutput,
	).Error
	if err != nil && err != gorm.ErrRecordNotFound {
		return nil, errors.New("Error retrieving permissions")
	}

	return PermissionsOutput, nil
}

func (r *queryResolver) PipelinePermissions(ctx context.Context, userID string, environmentID string, pipelineID string) ([]*privategraphql.PipelinePermissionsOutput, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{

		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "platform_environment", ResourceID: platformID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_edit_all_pipelines", ResourceID: platformID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "specific_pipeline", ResourceID: pipelineID, Access: "assign_pipeline_permission", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "specific_pipeline", ResourceID: pipelineID, Access: "read", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "specific_pipeline", ResourceID: pipelineID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "specific_pipeline", ResourceID: pipelineID, Access: "run", EnvironmentID: environmentID},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return nil, errors.New("Requires permissions.")
	}

	var PermissionsOutput []*privategraphql.PipelinePermissionsOutput

	err := database.DBConn.Raw(
		`
		(select 
			string_agg(
		  p.access
		  ,',') as access,
		  p.subject,
		  p.subject_id,
          pipelines.name as pipeline_name,
		  p.resource_id,
		  p.environment_id,
		  p.active,
		  pt.level,
		  pt.label,
		  users.first_name,
		  users.last_name,
		  users.email,
		  users.job_title
		  from 
		  permissions p, permissions_resource_types pt, users, pipelines
		  where 
		  p.resource = pt.code and
		  p.subject = 'user' and 
		  p.subject_id = users.user_id and
		  pt.level = 'specific'and
		  p.resource_id = pipelines.pipeline_id and
		  p.resource_id = ? and
		  p.active = true	
		  GROUP BY 
		  p.subject,
		  p.subject_id,
		  pipelines.name,
		  p.resource_id,
		  p.environment_id,
		  p.active,
		  p.subject_id,
		  pt.level,
		  pt.label,
		  users.first_name,
		  users.last_name,
		  users.email,
		  users.job_title
		)
		UNION
		(
		select 
		string_agg(
			p.access
			,',') as access,
		  p.subject,
		  p.subject_id,
		  pipelines.name,
		  p.resource_id,
		  p.environment_id,
		  p.active,
		  pt.level,
		  pt.label,
		  pag.name,
		  '',
		  '',
		  ''
	  
		  from 
		  permissions p, permissions_resource_types pt,    	permissions_access_groups pag, pipelines
		  where 
		  p.resource = pt.code and
		  pag.access_group_id = p.subject_id and
		  p.subject = 'access_group' and 
		  p.resource_id = pipelines.pipeline_id and
		  p.resource_id = ? and
		  p.active = true	
		  GROUP BY 
		  p.subject,
		  p.subject_id,
		  pipelines.name,
		  p.resource_id,
		  p.environment_id,
		  p.active,
		  pt.level,
		  pt.label,
		  pag.name
		)
`,
		//direct
		pipelineID,
		pipelineID,
	).Scan(
		&PermissionsOutput,
	).Error
	if err != nil && err != gorm.ErrRecordNotFound {
		return nil, errors.New("Error retrieving permissions")
	}

	return PermissionsOutput, nil
}
