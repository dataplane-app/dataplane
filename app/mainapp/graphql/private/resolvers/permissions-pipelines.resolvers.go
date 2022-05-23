package privateresolvers

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"context"
	permissions "dataplane/mainapp/auth_permissions"
	"dataplane/mainapp/config"
	"dataplane/mainapp/database"
	"dataplane/mainapp/database/models"
	privategraphql "dataplane/mainapp/graphql/private"
	"dataplane/mainapp/logging"
	"errors"

	"gorm.io/gorm"
)

func (r *mutationResolver) PipelinePermissionsToUser(ctx context.Context, environmentID string, resourceID string, access []string, userID string) (string, error) {
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

	// --- First delete all permissions
	err := database.DBConn.Where("subject_id = ? and resource=? and resource_id = ? and environment_id = ?",
		userID, "specific_pipeline", resourceID, environmentID).Delete(&models.Permissions{}).Error

	if err != nil {
		if config.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Delete pipelines permission to user database error.")
	}

	// --- Next, add selected permissions
	for _, accessType := range access {

		_, err := permissions.UpsertSpecificPermission(
			"user",
			userID,
			"specific_pipeline",
			resourceID,
			accessType,
			environmentID,
			false,
		)

		if err != nil {
			if config.Debug == "true" {
				logging.PrintSecretsRedact(err)
			}
			return "", errors.New("Add permission to user database error.")
		}
	}

	return "Access permissions updated.", nil
}

func (r *mutationResolver) PipelinePermissionsToAccessGroup(ctx context.Context, environmentID string, resourceID string, access []string, accessGroupID string) (string, error) {
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

	// --- First delete all permissions
	err := database.DBConn.Where("subject_id = ? and resource=? and resource_id = ? and environment_id = ?",
		accessGroupID, "specific_pipeline", resourceID, environmentID).Delete(&models.Permissions{}).Error

	if err != nil {
		if config.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Delete pipelines permission to user database error.")
	}

	// --- Next, add selected permissions
	for _, accessType := range access {

		_, err := permissions.UpsertSpecificPermission(
			"access_group",
			accessGroupID,
			"specific_pipeline",
			resourceID,
			accessType,
			environmentID,
			false,
		)

		if err != nil {
			if config.Debug == "true" {
				logging.PrintSecretsRedact(err)
			}
			return "", errors.New("Add permission to user database error.")
		}
	}

	return "Access permissions updated.", nil
}

func (r *queryResolver) MyPipelinePermissions(ctx context.Context) ([]*privategraphql.PipelinePermissionsOutput, error) {
	currentUser := ctx.Value("currentUser").(string)

	// Permissions - as logged in user

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
		)UNION(
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
				permissions_accessg_users pagu,
				pipelines
			  where
				p.resource = pt.code
				and pt.level = 'specific'
		  
				and p.subject = 'access_group'
				and p.subject_id = pagu.access_group_id
				and pag.access_group_id = pagu.access_group_id
				and pagu.user_id = ?
		  
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
		currentUser,
		currentUser,
	).Scan(
		&PermissionsOutput,
	).Error
	if err != nil && err != gorm.ErrRecordNotFound {
		return nil, errors.New("Error retrieving permissions")
	}

	return PermissionsOutput, nil
}

func (r *queryResolver) UserPipelinePermissions(ctx context.Context, userID string, environmentID string) ([]*privategraphql.PipelinePermissionsOutput, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{

		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "platform_environment", ResourceID: platformID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_edit_all_pipelines", ResourceID: platformID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_all_pipelines", ResourceID: platformID, Access: "read", EnvironmentID: environmentID},
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
				permissions_accessg_users pagu,
				pipelines
			  where
				p.resource = pt.code
				and pt.level = 'specific'
		  
				and p.subject = 'access_group'
				and p.subject_id = pag.access_group_id
				and pag.access_group_id = pagu.access_group_id
				and pagu.access_group_id = ?
		  
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

func (r *queryResolver) UserSinglePipelinePermissions(ctx context.Context, userID string, environmentID string, pipelineID string, subjectType string) (*privategraphql.PipelinePermissionsOutput, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{

		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "platform_environment", ResourceID: platformID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_edit_all_pipelines", ResourceID: platformID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_all_pipelines", ResourceID: platformID, Access: "read", EnvironmentID: environmentID},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return nil, errors.New("Requires permissions.")
	}

	var PermissionsOutput *privategraphql.PipelinePermissionsOutput

	var rawQuery string
	if subjectType == "user" {
		rawQuery = `
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
	and p.resource_id = ?
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
		`
	}

	if subjectType == "access_group" {
		rawQuery = `
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
	pag.name
from
	permissions p,
	permissions_resource_types pt,
	permissions_access_groups pag,
	permissions_accessg_users pagu,
	pipelines
where
	p.resource = pt.code
	and pt.level = 'specific'
	and p.subject = 'access_group'
	and p.subject_id = pag.access_group_id
	and pag.access_group_id = pagu.access_group_id
	and p.subject_id = ?
	and p.resource_id = pipelines.pipeline_id
	and p.resource_id = ?
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
		`
	}

	err := database.DBConn.Debug().Raw(rawQuery,
		//direct
		userID,
		pipelineID,
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
		  permissions p, permissions_resource_types pt,    	
		  permissions_access_groups pag, 
		  pipelines
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
