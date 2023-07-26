package privateresolvers

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"context"
	"errors"

	permissions "github.com/dataplane-app/dataplane/app/mainapp/auth_permissions"
	dpconfig "github.com/dataplane-app/dataplane/app/mainapp/config"
	"github.com/dataplane-app/dataplane/app/mainapp/database"
	"github.com/dataplane-app/dataplane/app/mainapp/database/models"
	privategraphql "github.com/dataplane-app/dataplane/app/mainapp/graphql/private"
	"github.com/dataplane-app/dataplane/app/mainapp/logging"
	"gorm.io/gorm"
)

// DeploymentPermissionsToUser is the resolver for the deploymentPermissionsToUser field.
func (r *mutationResolver) DeploymentPermissionsToUser(ctx context.Context, environmentID string, resourceID string, access []string, userID string) (string, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "admin_environment", ResourceID: environmentID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_edit_all_pipelines", ResourceID: environmentID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "specific_deployment", ResourceID: resourceID, Access: "write", EnvironmentID: environmentID},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return "", errors.New("Requires permissions.")
	}

	// --- First delete all permissions
	err := database.DBConn.Where("subject_id = ? and resource=? and resource_id = ? and environment_id = ?",
		userID, "specific_deployment", resourceID, environmentID).Delete(&models.Permissions{}).Error

	if err != nil {
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Delete deployment's permission to user database error.")
	}

	// --- Next, add selected permissions
	for _, accessType := range access {

		_, err := permissions.UpsertSpecificPermission(
			"user",
			userID,
			"specific_deployment",
			resourceID,
			accessType,
			environmentID,
			false,
		)

		if err != nil {
			if dpconfig.Debug == "true" {
				logging.PrintSecretsRedact(err)
			}
			return "", errors.New("Add permission to user database error.")
		}
	}

	return "Access permissions updated.", nil
}

// DeploymentPermissionsToAccessGroup is the resolver for the deploymentPermissionsToAccessGroup field.
func (r *mutationResolver) DeploymentPermissionsToAccessGroup(ctx context.Context, environmentID string, resourceID string, access []string, accessGroupID string) (string, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "admin_environment", ResourceID: environmentID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_edit_all_pipelines", ResourceID: environmentID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "specific_deployment", ResourceID: resourceID, Access: "write", EnvironmentID: environmentID},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return "", errors.New("Requires permissions.")
	}

	// --- First delete all permissions
	err := database.DBConn.Where("subject_id = ? and resource=? and resource_id = ? and environment_id = ?",
		accessGroupID, "specific_deployment", resourceID, environmentID).Delete(&models.Permissions{}).Error

	if err != nil {
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Delete deployment's permission to user database error.")
	}

	// --- Next, add selected permissions
	for _, accessType := range access {

		_, err := permissions.UpsertSpecificPermission(
			"access_group",
			accessGroupID,
			"specific_deployment",
			resourceID,
			accessType,
			environmentID,
			false,
		)

		if err != nil {
			if dpconfig.Debug == "true" {
				logging.PrintSecretsRedact(err)
			}
			return "", errors.New("Add permission to user database error.")
		}
	}

	return "Access permissions updated.", nil
}

// MyDeploymentPermissions is the resolver for the myDeploymentPermissions field.
func (r *queryResolver) MyDeploymentPermissions(ctx context.Context) ([]*privategraphql.DeploymentPermissionsOutput, error) {
	currentUser := ctx.Value("currentUser").(string)

	// Permissions - as logged in user

	var PermissionsOutput []*privategraphql.DeploymentPermissionsOutput

	err := database.DBConn.Raw(
		`
		(
			select
			  string_agg(distinct p.access, ',') as access,
			  p.subject,
			  p.subject_id,
			  deploy_pipelines.name as pipeline_name,
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
			  deploy_pipelines
			where
			  p.resource = pt.code
			  and pt.level = 'specific'
		  
			  and p.subject = 'user'
			  and p.subject_id = users.user_id
			  and p.subject_id = ?
		  
			  and deploy_pipelines.deploy_active = 'true'
			  and p.resource_id = deploy_pipelines.pipeline_id
		  
			  and p.active = true
		  
			GROUP BY
			  p.subject,
			  p.subject_id,
			  deploy_pipelines.name,
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
				string_agg(distinct p.access, ',') as access,
				p.subject,
				p.subject_id,
				deploy_pipelines.name,
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
				deploy_pipelines
			  where
				p.resource = pt.code
				and pt.level = 'specific'
		  
				and p.subject = 'access_group'
				and p.subject_id = pagu.access_group_id
				and pag.access_group_id = pagu.access_group_id
				and pagu.user_id = ?
		  
				and deploy_pipelines.deploy_active = 'true'
				and p.resource_id = deploy_pipelines.pipeline_id
				
				and p.active = true
				
			  GROUP BY
			    p.subject,
				p.subject_id,
				deploy_pipelines.name,
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

// UserSingleDeploymentPermissions is the resolver for the userSingleDeploymentPermissions field.
func (r *queryResolver) UserSingleDeploymentPermissions(ctx context.Context, userID string, environmentID string, deploymentID string, subjectType string) (*privategraphql.DeploymentPermissionsOutput, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{

		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "admin_environment", ResourceID: environmentID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_edit_all_pipelines", ResourceID: environmentID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_all_pipelines", ResourceID: environmentID, Access: "read", EnvironmentID: environmentID},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return nil, errors.New("Requires permissions.")
	}

	var PermissionsOutput *privategraphql.DeploymentPermissionsOutput

	var rawQuery string
	if subjectType == "user" {
		rawQuery = `
		select
		string_agg(distinct p.access, ',') as access,
		p.subject,
		p.subject_id,
		deploy_pipelines.name as pipeline_name,
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
		deploy_pipelines
	  where
		p.resource = pt.code
		and pt.level = 'specific'
		and p.subject = 'user'
		and p.subject_id = users.user_id
		and p.subject_id = ?
		and p.resource_id = deploy_pipelines.pipeline_id
        and p.resource_id = ?
		and p.active = true
		and p.environment_id = ?
	
	  GROUP BY
		p.subject,
		p.subject_id,
		deploy_pipelines.name,
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
				string_agg(distinct p.access, ',') as access,
				p.subject,
				p.subject_id,
				deploy_pipelines.name as pipeline_name,
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
				deploy_pipelines
			  where
				p.resource = pt.code
				and pt.level = 'specific'
		  
				and p.subject = 'access_group'
				and p.subject_id = pag.access_group_id
				and p.subject_id = ?
		  
				and p.resource_id = deploy_pipelines.pipeline_id
				and p.resource_id = ?
		  
				and p.active = true
				and p.environment_id = ?
				
			  GROUP BY
				p.subject,
				p.subject_id,
				deploy_pipelines.name,
				p.resource_id,
				p.environment_id,
				p.active,
				pt.level,
				pt.label,
				pag.name
		`
	}

	err := database.DBConn.Raw(rawQuery,
		//direct
		userID,
		deploymentID,
		environmentID,
	).Scan(
		&PermissionsOutput,
	).Error
	if err != nil && err != gorm.ErrRecordNotFound {
		return nil, errors.New("Error retrieving permissions")
	}

	return PermissionsOutput, nil
}

// UserDeploymentPermissions is the resolver for the userDeploymentPermissions field.
func (r *queryResolver) UserDeploymentPermissions(ctx context.Context, userID string, environmentID string, subjectType string) ([]*privategraphql.DeploymentPermissionsOutput, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{

		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "admin_environment", ResourceID: environmentID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_edit_all_pipelines", ResourceID: environmentID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_all_pipelines", ResourceID: environmentID, Access: "read", EnvironmentID: environmentID},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return nil, errors.New("Requires permissions.")
	}

	var PermissionsOutput []*privategraphql.DeploymentPermissionsOutput

	var rawQuery string
	if subjectType == "user" {
		rawQuery = `
		select
		string_agg(distinct p.access, ',') as access,
		p.subject,
		p.subject_id,
		deploy_pipelines.name as pipeline_name,
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
		deploy_pipelines
	  where
		p.resource = pt.code
		and pt.level = 'specific'
	
		and p.subject = 'user'
		and p.subject_id = users.user_id
		and p.subject_id = ?
	
		and deploy_pipelines.deploy_active = 'true'
		and p.resource_id = deploy_pipelines.pipeline_id
	
		and p.active = true
		and p.environment_id = ?
	
	  GROUP BY
		p.subject,
		p.subject_id,
		deploy_pipelines.name,
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
				string_agg(distinct p.access, ',') as access,
				p.subject,
				p.subject_id,
				deploy_pipelines.name as pipeline_name,
				p.resource_id,
				p.environment_id,
				p.active,
				pt.level,
				pt.label,
				pag.name as first_name
			  from
				permissions p,
				permissions_resource_types pt,
				permissions_access_groups pag,
				permissions_accessg_users pagu,
				deploy_pipelines
			  where
				p.resource = pt.code
				and pt.level = 'specific'
		  
				and p.subject = 'access_group'
				and p.subject_id = pag.access_group_id
				and pag.access_group_id = pagu.access_group_id
				and pagu.access_group_id = ?
		  
				and deploy_pipelines.deploy_active = 'true'
				and p.resource_id = deploy_pipelines.pipeline_id
		  
				and p.active = true
				and p.environment_id = ?
				
			  GROUP BY
			    p.subject,
				p.subject_id,
				deploy_pipelines.name,
				p.resource_id,
				p.environment_id,
				p.active,
				pt.level,
				pt.label,
				pag.name
		`
	}
	err := database.DBConn.Raw(rawQuery, userID, environmentID).
		Scan(&PermissionsOutput).Error
	if err != nil && err != gorm.ErrRecordNotFound {
		return nil, errors.New("Error retrieving permissions")
	}

	return PermissionsOutput, nil
}

// DeploymentPermissions is the resolver for the deploymentPermissions field.
func (r *queryResolver) DeploymentPermissions(ctx context.Context, userID string, environmentID string, deploymentID string) ([]*privategraphql.DeploymentPermissionsOutput, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{

		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "admin_environment", ResourceID: environmentID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_edit_all_pipelines", ResourceID: environmentID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "specific_deployment", ResourceID: deploymentID, Access: "assign_pipeline_permission", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "specific_deployment", ResourceID: deploymentID, Access: "read", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "specific_deployment", ResourceID: deploymentID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "specific_deployment", ResourceID: deploymentID, Access: "run", EnvironmentID: environmentID},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return nil, errors.New("Requires permissions.")
	}

	var PermissionsOutput []*privategraphql.DeploymentPermissionsOutput

	err := database.DBConn.Raw(
		`
		(select 
			string_agg(distinct 
		  p.access
		  ,',') as access,
		  p.subject,
		  p.subject_id,
          deploy_pipelines.name as pipeline_name,
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
		  permissions p, permissions_resource_types pt, users, deploy_pipelines
		  where 
		  p.resource = pt.code and
		  p.subject = 'user' and 
		  p.subject_id = users.user_id and
		  pt.level = 'specific'and
		  p.resource_id = deploy_pipelines.pipeline_id and
		  p.resource_id = ? and
		  p.active = true	
		  and p.environment_id = ?
		  GROUP BY 
		  p.subject,
		  p.subject_id,
		  deploy_pipelines.name,
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
		string_agg(distinct 
			p.access
			,',') as access,
		  p.subject,
		  p.subject_id,
		  deploy_pipelines.name,
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
		  permissions p, permissions_resource_types pt,    	permissions_access_groups pag, deploy_pipelines
		  where 
		  p.resource = pt.code and
		  pag.access_group_id = p.subject_id and
		  p.subject = 'access_group' and 
		  p.resource_id = deploy_pipelines.pipeline_id and
		  p.resource_id = ? and
		  p.active = true	
		  and p.environment_id = ?
		  GROUP BY 
		  p.subject,
		  p.subject_id,
		  deploy_pipelines.name,
		  p.resource_id,
		  p.environment_id,
		  p.active,
		  pt.level,
		  pt.label,
		  pag.name
		)
`,
		//direct
		deploymentID,
		environmentID,
		deploymentID,
		environmentID,
	).Scan(
		&PermissionsOutput,
	).Error
	if err != nil && err != gorm.ErrRecordNotFound {
		return nil, errors.New("Error retrieving permissions")
	}

	return PermissionsOutput, nil
}
