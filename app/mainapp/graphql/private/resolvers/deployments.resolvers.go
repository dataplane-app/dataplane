package privateresolvers

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"context"
	permissions "dataplane/mainapp/auth_permissions"
	"dataplane/mainapp/code_editor/filesystem"
	"dataplane/mainapp/config"
	"dataplane/mainapp/database"
	"dataplane/mainapp/database/models"
	privategraphql "dataplane/mainapp/graphql/private"
	"dataplane/mainapp/logging"
	"dataplane/mainapp/utilities"
	"encoding/json"
	"errors"
	"fmt"
	"os"

	"gorm.io/gorm"
)

func (r *mutationResolver) AddDeployment(ctx context.Context, pipelineID string, fromEnvironmentID string, toEnvironmentID string, version string, workerGroup string, liveactive bool, nodeWorkerGroup []*privategraphql.WorkerGroupsNodes) (string, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Deploy To Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "platform_environment", ResourceID: platformID, Access: "write", EnvironmentID: toEnvironmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_deploy_here", ResourceID: platformID, Access: "write", EnvironmentID: toEnvironmentID},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return "", errors.New("Requires permissions: environment_deploy_here")
	}

	// ----- Deploy from Permissions
	perms = []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "platform_environment", ResourceID: platformID, Access: "write", EnvironmentID: fromEnvironmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_deploy_all_pipelines", ResourceID: platformID, Access: "write", EnvironmentID: fromEnvironmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "specific_pipeline", ResourceID: pipelineID, Access: "deploy", EnvironmentID: fromEnvironmentID},
	}

	permOutcome, _, _, _ = permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return "", errors.New("Requires permissions: environment_edit_all_pipelines")
	}

	// Does version already exists?
	deploypipeline := models.DeployPipelines{}
	err := database.DBConn.Where("pipeline_id = ? and version = ? and environment_id = ?", "d-"+pipelineID, version, toEnvironmentID).First(&deploypipeline).Error

	if err != nil && err != gorm.ErrRecordNotFound {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Retrieve pipeline database error")
	}

	if deploypipeline.PipelineID != "" {
		return "", errors.New("Deployment version already found.")
	}

	// Obtain pipeline details
	// ----- Get pipeline
	pipeline := models.Pipelines{}
	err = database.DBConn.Where("pipeline_id = ? and environment_id = ?", pipelineID, fromEnvironmentID).First(&pipeline).Error
	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Retrieve pipeline database error")
	}

	pipelineNodes := []*models.PipelineNodes{}
	err = database.DBConn.Where("pipeline_id = ? and environment_id = ?", pipelineID, fromEnvironmentID).Find(&pipelineNodes).Error
	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Retrieve pipeline database error")
	}

	pipelineEdges := []*models.PipelineEdges{}
	err = database.DBConn.Where("pipeline_id = ? and environment_id = ?", pipelineID, fromEnvironmentID).Find(&pipelineEdges).Error
	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Retrieve pipeline database error")
	}

	folders := []*models.CodeFolders{}
	err = database.DBConn.Where("pipeline_id = ? and environment_id = ?", pipelineID, fromEnvironmentID).Find(&folders).Error
	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Retrieve pipeline folders database error")
	}

	files := []*models.CodeFiles{}
	err = database.DBConn.Where("pipeline_id = ? and environment_id = ?", pipelineID, fromEnvironmentID).Find(&files).Error
	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Retrieve pipeline folders database error")
	}

	// Obtain folder structure for pipeline
	pipelineFolder := models.CodeFolders{}
	err = database.DBConn.Where("pipeline_id = ? and environment_id = ? and level = ?", pipelineID, fromEnvironmentID, "pipeline").First(&pipelineFolder).Error
	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Retrieve pipeline folders database error")
	}

	pfolder, _ := filesystem.FolderConstructByID(database.DBConn, pipelineFolder.ParentID, fromEnvironmentID, "")
	foldertocopy, _ := filesystem.FolderConstructByID(database.DBConn, pipelineFolder.FolderID, fromEnvironmentID, "pipelines")

	foldertocopy = config.CodeDirectory + foldertocopy
	destinationfolder := config.CodeDirectory + pfolder + "deployments/" + pipelineFolder.FolderID + "_" + pipelineFolder.FolderName + "/" + version + "/"
	// log.Println("Folder to copy:", foldertocopy)
	// log.Println("Destination folder:", destinationfolder)

	// Create a folder for the version and copy files across
	err = utilities.CopyDirectory(foldertocopy, destinationfolder)
	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Failed to copy deployment files.")
	}

	// Copy pipeline, nodes and edges

	// Pipeline
	createPipeline := models.DeployPipelines{
		PipelineID:        "d-" + pipeline.PipelineID,
		Version:           version,
		DeployActive:      false,
		Name:              pipeline.Name,
		EnvironmentID:     toEnvironmentID,
		FromEnvironmentID: fromEnvironmentID,
		FromPipelineID:    pipeline.PipelineID,
		Description:       pipeline.Description,
		Active:            pipeline.Active,
		WorkerGroup:       workerGroup,
		Meta:              pipeline.Meta,
		Json:              pipeline.Json,
		UpdateLock:        true,
	}

	// Recalculate edge dependencies and destinations with new d- ID
	var destinations = make(map[string][]string)
	var dependencies = make(map[string][]string)

	// Edges
	deployEdges := []*models.DeployPipelineEdges{}
	for _, edge := range pipelineEdges {
		deployEdges = append(deployEdges, &models.DeployPipelineEdges{
			EdgeID:        "d-" + edge.EdgeID,
			PipelineID:    createPipeline.PipelineID,
			Version:       createPipeline.Version,
			From:          "d-" + edge.From,
			To:            "d-" + edge.To,
			EnvironmentID: createPipeline.EnvironmentID,
			Meta:          edge.Meta,
			Active:        edge.Active,
		})

		// map out dependencies and destinations
		destinations["d-"+edge.From] = append(destinations["d-"+edge.From], "d-"+edge.To)
		dependencies["d-"+edge.To] = append(dependencies["d-"+edge.To], "d-"+edge.From)
	}

	// Map
	var nodeworkergroupmap = make(map[string]string)
	for _, nwg := range nodeWorkerGroup {
		nodeworkergroupmap[nwg.NodeID] = nwg.WorkerGroup
	}
	// Nodes
	var online bool
	deployNodes := []*models.DeployPipelineNodes{}
	for _, node := range pipelineNodes {

		dependJSON, err := json.Marshal(dependencies["d-"+node.NodeID])
		if err != nil {
			logging.PrintSecretsRedact(err)
		}

		destinationJSON, err := json.Marshal(destinations["d-"+node.NodeID])
		if err != nil {
			logging.PrintSecretsRedact(err)
		}

		var workergroupassign string
		if _, ok := nodeworkergroupmap[node.NodeID]; ok {
			workergroupassign = nodeworkergroupmap[node.NodeID]
		} else {
			workergroupassign = workerGroup
		}

		//Assign an online value
		if node.NodeTypeDesc == "play" {
			online = true
		} else {
			if node.NodeType == "trigger" {
				online = liveactive
			} else {
				online = node.TriggerOnline
			}

		}

		deployNodes = append(deployNodes, &models.DeployPipelineNodes{
			NodeID:        "d-" + node.NodeID,
			PipelineID:    createPipeline.PipelineID,
			Version:       createPipeline.Version,
			Name:          node.Name,
			EnvironmentID: createPipeline.EnvironmentID,
			NodeType:      node.NodeType,
			NodeTypeDesc:  node.NodeTypeDesc,
			TriggerOnline: online,
			Description:   node.Description,
			Commands:      node.Commands,
			Meta:          node.Meta,

			// Needs to be recalculated
			Dependency:  dependJSON,
			Destination: destinationJSON,

			// Needs to updated via front end sub nodes
			WorkerGroup: workergroupassign,
			Active:      node.Active,
		})
	}

	// folders
	deployFolders := []*models.DeployCodeFolders{}
	for _, n := range folders {
		deployFolders = append(deployFolders, &models.DeployCodeFolders{
			FolderID:      n.FolderID,
			ParentID:      n.ParentID,
			EnvironmentID: createPipeline.EnvironmentID,
			PipelineID:    createPipeline.PipelineID,
			Version:       createPipeline.Version,
			NodeID:        "d-" + n.NodeID,
			FolderName:    n.FolderName,
			Level:         n.Level,
			FType:         n.FType,
			Active:        n.Active,
		})
	}

	deployFiles := []*models.DeployCodeFiles{}
	for _, n := range files {
		deployFiles = append(deployFiles, &models.DeployCodeFiles{
			FileID:        n.FileID,
			FolderID:      n.FolderID,
			EnvironmentID: createPipeline.EnvironmentID,
			PipelineID:    createPipeline.PipelineID,
			Version:       createPipeline.Version,
			NodeID:        "d-" + n.NodeID,
			FileName:      n.FileName,
			Level:         n.Level,
			FType:         n.FType,
			Active:        n.Active,
		})
	}

	// Pipeline create
	err = database.DBConn.Create(&createPipeline).Error
	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Failed to create deployment pipeline.")
	}

	// Nodes create
	err = database.DBConn.Create(&deployNodes).Error
	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Failed to create deployment pipeline.")
	}

	// Edges create
	err = database.DBConn.Create(&deployEdges).Error
	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Failed to create deployment pipeline.")
	}

	// Folders create
	err = database.DBConn.Create(&deployFolders).Error
	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Failed to create deployment pipeline.")
	}

	// Files create
	err = database.DBConn.Create(&deployFiles).Error
	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Failed to create deployment pipeline.")
	}

	// Switch to active and take off update lock
	err = database.DBConn.Exec(`
	update deploy_pipelines set 
	deploy_active = CASE 
      WHEN version = ?  THEN true
      ELSE false
	END,
	update_lock = false
	where pipeline_id = ? and environment_id = ?
	`, version, "d-"+pipelineID, toEnvironmentID).Error
	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Failed to create deployment pipeline.")
	}

	return "OK", nil
}

func (r *queryResolver) GetDeployment(ctx context.Context, pipelineID string, environmentID string) (*privategraphql.Deployments, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "platform_environment", ResourceID: platformID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_all_deployments", ResourceID: platformID, Access: "read", EnvironmentID: environmentID},
	}

	_, _, admin, adminEnv := permissions.MultiplePermissionChecks(perms)

	// if permOutcome == "denied" {
	// 	return []*privategraphql.Pipelines{}, nil
	// }

	p := privategraphql.Deployments{}
	var query string
	if admin == "yes" || adminEnv == "yes" {
		query = `
select
a.pipeline_id, 
a.name,
a.environment_id,
a.description,
a.active,
a.worker_group,
a.created_at,
a.updated_at,
a.version,
a.deploy_active,
b.node_type,
b.node_type_desc,
b.online,
scheduler.schedule,
scheduler.schedule_type
from deploy_pipelines a left join (
	select node_type, node_type_desc, pipeline_id, trigger_online as online from deploy_pipeline_nodes where node_type='trigger'
) b on a.pipeline_id=b.pipeline_id
left join scheduler on scheduler.pipeline_id = a.pipeline_id
where a.pipeline_id = ?
order by a.created_at desc
`

		err := database.DBConn.Raw(
			query, pipelineID).Scan(&p).Error

		if err != nil {
			if os.Getenv("debug") == "true" {
				logging.PrintSecretsRedact(err)
			}
			return nil, errors.New("Retrive pipelines database error.")
		}

	} else {

		query = `select
a.pipeline_id, 
a.name,
a.environment_id,
a.description,
a.active,
a.worker_group,
a.created_at,
a.updated_at,
b.node_type,
b.node_type_desc,
a.version,
a.deploy_active,
b.online,
scheduler.schedule,
scheduler.schedule_type
from deploy_pipelines a 
left join (
	select node_type, node_type_desc, pipeline_id, trigger_online as online from deploy_pipeline_nodes where node_type='trigger'
) b on a.pipeline_id=b.pipeline_id
inner join (
  select distinct resource_id, environment_id from (
	(select 
		p.resource_id,
        p.environment_id
		from 
		permissions p
		where 
		p.subject = 'user' and 
		p.subject_id = ? and
		p.resource = 'specific_deployment' and
		p.active = true
		)
		union
		(
		select
		p.resource_id,
        p.environment_id
		from 
		permissions p, permissions_accessg_users agu
		where 
		p.subject = 'access_group' and 
		p.subject_id = agu.user_id and
		p.subject_id = ? and
		p.resource = 'specific_deployment' and
		p.environment_id = agu.environment_id and 
		p.active = true and
		agu.active = true
		)
	) x

) p on p.resource_id = a.pipeline_id and p.environment_id = a.environment_id
left join scheduler on scheduler.pipeline_id = a.pipeline_id
where 
a.pipeline_id = ?
order by a.created_at desc`

		err := database.DBConn.Raw(
			query, currentUser, currentUser, pipelineID).Scan(&p).Error

		if err != nil {
			if os.Getenv("debug") == "true" {
				logging.PrintSecretsRedact(err)
			}

			if err != gorm.ErrRecordNotFound {
				return nil, errors.New("Retrive pipelines database error.")
			}
		}

	}

	// err := database.DBConn.Select("pipeline_id", "name", "environment_id", "description", "active", "online", "worker_group", "created_at").Order("created_at desc").Where("environment_id = ?", environmentID).Find(&p).Error

	return &p, nil
}

func (r *queryResolver) GetDeployments(ctx context.Context, environmentID string) ([]*privategraphql.Deployments, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "platform_environment", ResourceID: platformID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_all_deployments", ResourceID: platformID, Access: "read", EnvironmentID: environmentID},
	}

	_, _, admin, adminEnv := permissions.MultiplePermissionChecks(perms)

	// if permOutcome == "denied" {
	// 	return []*privategraphql.Pipelines{}, nil
	// }

	p := []*privategraphql.Deployments{}
	var query string
	if admin == "yes" || adminEnv == "yes" {
		query = `
select
a.pipeline_id, 
a.name,
a.environment_id,
a.description,
a.active,
a.worker_group,
a.created_at,
b.node_type,
b.node_type_desc,
b.online,
scheduler.schedule,
scheduler.schedule_type
from deploy_pipelines a left join (
	select node_type, node_type_desc, pipeline_id, trigger_online as online from deploy_pipeline_nodes where node_type='trigger'
) b on a.pipeline_id=b.pipeline_id
left join scheduler on scheduler.pipeline_id = a.pipeline_id
where a.environment_id = ?
order by a.created_at desc
`

		err := database.DBConn.Raw(
			query, environmentID).Scan(&p).Error

		if err != nil {
			if os.Getenv("debug") == "true" {
				logging.PrintSecretsRedact(err)
			}
			return nil, errors.New("Retrive pipelines database error.")
		}

	} else {

		query = `select
a.pipeline_id, 
a.name,
a.environment_id,
a.description,
a.active,
a.worker_group,
a.created_at,
b.node_type,
b.node_type_desc,
b.online,
scheduler.schedule,
scheduler.schedule_type
from deploy_pipelines a 
left join (
	select node_type, node_type_desc, pipeline_id, trigger_online as online from deploy_pipeline_nodes where node_type='trigger'
) b on a.pipeline_id=b.pipeline_id
inner join (
  select distinct resource_id, environment_id from (
	(select 
		p.resource_id,
        p.environment_id
		from 
		permissions p
		where 
		p.subject = 'user' and 
		p.subject_id = ? and
		p.resource = 'specific_deployment' and
		p.active = true
		)
		union
		(
		select
		p.resource_id,
        p.environment_id
		from 
		permissions p, permissions_accessg_users agu
		where 
		p.subject = 'access_group' and 
		p.subject_id = agu.user_id and
		p.subject_id = ? and
		p.resource = 'specific_deployment' and
		p.environment_id = agu.environment_id and 
		p.active = true and
		agu.active = true
		)
	) x

) p on p.resource_id = a.pipeline_id and p.environment_id = a.environment_id
left join scheduler on scheduler.pipeline_id = a.pipeline_id
where 
a.environment_id = ?
order by a.created_at desc`

		err := database.DBConn.Raw(
			query, currentUser, currentUser, environmentID).Scan(&p).Error

		if err != nil {
			if os.Getenv("debug") == "true" {
				logging.PrintSecretsRedact(err)
			}

			if err != gorm.ErrRecordNotFound {
				return nil, errors.New("Retrive pipelines database error.")
			}
		}

	}

	// err := database.DBConn.Select("pipeline_id", "name", "environment_id", "description", "active", "online", "worker_group", "created_at").Order("created_at desc").Where("environment_id = ?", environmentID).Find(&p).Error

	return p, nil
}

func (r *queryResolver) GetNonDefaultWGNodes(ctx context.Context, pipelineID string, environmentID string) ([]*privategraphql.NonDefaultNodes, error) {
	panic(fmt.Errorf("not implemented"))
}
