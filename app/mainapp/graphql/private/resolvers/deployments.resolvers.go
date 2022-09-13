package privateresolvers

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"context"
	"dataplane/mainapp/auth_permissions"
	"dataplane/mainapp/code_editor/filesystem"
	"dataplane/mainapp/config"
	"dataplane/mainapp/database"
	"dataplane/mainapp/database/models"
	privategraphql "dataplane/mainapp/graphql/private"
	"dataplane/mainapp/logging"
	"dataplane/mainapp/messageq"
	"dataplane/mainapp/utilities"
	"encoding/json"
	"errors"
	"log"
	"os"
	"strings"

	"gorm.io/gorm"
)

func (r *deploymentEdgesResolver) Meta(ctx context.Context, obj *models.DeployPipelineEdges) (interface{}, error) {
	return obj.Meta, nil
}

func (r *deploymentNodesResolver) Commands(ctx context.Context, obj *models.DeployPipelineNodes) (interface{}, error) {
	return obj.Commands, nil
}

func (r *deploymentNodesResolver) Meta(ctx context.Context, obj *models.DeployPipelineNodes) (interface{}, error) {
	return obj.Meta, nil
}

func (r *deploymentRunsResolver) RunJSON(ctx context.Context, obj *models.PipelineRuns) (interface{}, error) {
	return obj.RunJSON, nil
}

func (r *mutationResolver) AddDeployment(ctx context.Context, pipelineID string, fromEnvironmentID string, toEnvironmentID string, version string, workerGroup string, liveactive bool, nodeWorkerGroup []*privategraphql.WorkerGroupsNodes) (string, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)
	var triggerType string = ""

	// ----- Deploy To Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "admin_environment", ResourceID: toEnvironmentID, Access: "write", EnvironmentID: toEnvironmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_deploy_here", ResourceID: platformID, Access: "write", EnvironmentID: toEnvironmentID},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return "", errors.New("Requires permissions: environment_deploy_here")
	}

	// ----- Deploy from Permissions
	perms = []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "admin_environment", ResourceID: fromEnvironmentID, Access: "write", EnvironmentID: fromEnvironmentID},
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
		if config.Debug == "true" {
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
		if config.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Retrieve pipeline database error")
	}

	pipelineNodes := []*models.PipelineNodes{}
	err = database.DBConn.Where("pipeline_id = ? and environment_id = ?", pipelineID, fromEnvironmentID).Find(&pipelineNodes).Error
	if err != nil {
		if config.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Retrieve pipeline database error")
	}

	pipelineEdges := []*models.PipelineEdges{}
	err = database.DBConn.Where("pipeline_id = ? and environment_id = ?", pipelineID, fromEnvironmentID).Find(&pipelineEdges).Error
	if err != nil {
		if config.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Retrieve pipeline database error")
	}

	folders := []*models.CodeFolders{}
	err = database.DBConn.Where("pipeline_id = ? and environment_id = ?", pipelineID, fromEnvironmentID).Find(&folders).Error
	if err != nil {
		if config.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Retrieve pipeline folders database error")
	}

	files := []*models.CodeFiles{}
	err = database.DBConn.Where("pipeline_id = ? and environment_id = ?", pipelineID, fromEnvironmentID).Find(&files).Error
	if err != nil {
		if config.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Retrieve pipeline folders database error")
	}

	// Obtain folder structure for pipeline
	pipelineFolder := models.CodeFolders{}
	err = database.DBConn.Where("pipeline_id = ? and environment_id = ? and level = ?", pipelineID, fromEnvironmentID, "pipeline").First(&pipelineFolder).Error
	if err != nil {
		if config.Debug == "true" {
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
		if config.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Failed to copy deployment files.")
	}

	// Copy pipeline, nodes and edges
	var jsonstring string
	// json.Unmarshal([]byte(pipeline.Json), &jsonstring)

	jsonstring = string(pipeline.Json)

	jsonstring = strings.ReplaceAll(jsonstring, pipelineID, "d-"+pipeline.PipelineID)

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
		// Json:              pipeline.Json,
		UpdateLock: true,
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

		// replace in json pipeline run
		jsonstring = strings.ReplaceAll(jsonstring, edge.EdgeID, "d-"+edge.EdgeID)
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

		if node.NodeType == "trigger" && node.NodeTypeDesc == "schedule" {
			triggerType = "schedule"
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

		// Replace all nodes
		jsonstring = strings.ReplaceAll(jsonstring, node.NodeID, "d-"+node.NodeID)
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

	// Replace references to old pipeline
	var res interface{}
	json.Unmarshal([]byte(jsonstring), &res)
	pipelineJSON, err := json.Marshal(res)
	if err != nil {
		logging.PrintSecretsRedact(err)
	}
	createPipeline.Json = pipelineJSON

	// Pipeline create
	err = database.DBConn.Create(&createPipeline).Error
	if err != nil {
		if config.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Failed to create deployment pipeline.")
	}

	// Nodes create
	err = database.DBConn.Create(&deployNodes).Error
	if err != nil {
		if config.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Failed to create deployment pipeline.")
	}

	// Edges create
	if len(deployEdges) > 0 {
		err = database.DBConn.Create(&deployEdges).Error
		if err != nil {
			if config.Debug == "true" {
				logging.PrintSecretsRedact(err)
			}
			return "", errors.New("Failed to create deployment pipeline.")
		}
	}

	// Folders create
	if len(deployFolders) > 0 {
		err = database.DBConn.Create(&deployFolders).Error
		if err != nil {
			if config.Debug == "true" {
				logging.PrintSecretsRedact(err)
			}
			return "", errors.New("Failed to create deployment pipeline.")
		}
	}

	// Files create
	if len(deployFiles) > 0 {
		err = database.DBConn.Create(&deployFiles).Error
		if err != nil {
			if config.Debug == "true" {
				logging.PrintSecretsRedact(err)
			}
			return "", errors.New("Failed to create deployment pipeline.")
		}
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
		if config.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Failed to create deployment pipeline.")
	}

	// Turn off all previous deployments
	err = database.DBConn.Model(&models.DeployPipelineNodes{}).Where("pipeline_id = ? and environment_id = ? and version <> ? and trigger_online = true", "d-"+pipelineID, toEnvironmentID, version).Update("trigger_online", false).Error

	if err != nil {
		if config.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
	}

	// Give current user full permissions
	// Give access permissions for the user who added the pipeline
	AccessTypes := models.DeploymentAccessTypes

	for _, access := range AccessTypes {
		_, err := permissions.CreatePermission(
			"user",
			currentUser,
			"specific_deployment",
			"d-"+pipelineID,
			access,
			toEnvironmentID,
			false,
		)

		if err != nil {
			if config.Debug == "true" {
				logging.PrintSecretsRedact(err)
			}
			return "", errors.New("Add permission to user database error.")
		}

	}

	// Add back to schedule
	// ======= Update the schedule trigger ==========
	if triggerType == "schedule" {
		// Add back to schedule
		var plSchedules []*models.Scheduler

		// Adding an existing schedule from pipeline into deployment - needs to select pipeline
		err := database.DBConn.Where("pipeline_id = ? and environment_id =? and run_type=?", pipelineID, fromEnvironmentID, "pipeline").Find(&plSchedules).Error
		if err != nil && err != gorm.ErrRecordNotFound {
			log.Println("Removal of changed trigger schedules:", err)
		}

		if len(plSchedules) > 0 {
			for _, psc := range plSchedules {

				pipelineSchedules := models.Scheduler{
					NodeID:        "d-" + psc.NodeID,
					PipelineID:    "d-" + psc.PipelineID,
					EnvironmentID: toEnvironmentID,
					ScheduleType:  psc.ScheduleType,
					Schedule:      psc.Schedule,
					Timezone:      psc.Timezone,
					Online:        online,
					RunType:       "deployment",
				}
				// Add back to schedule
				err := messageq.MsgSend("pipeline-scheduler", pipelineSchedules)
				if err != nil {
					logging.PrintSecretsRedact("NATS error:", err)
				}
			}
		}

	}

	return "OK", nil
}

func (r *mutationResolver) DeleteDeployment(ctx context.Context, environmentID string, pipelineID string, version string) (string, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "admin_environment", ResourceID: environmentID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "specific_deployment", ResourceID: pipelineID, Access: "write", EnvironmentID: environmentID},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return "", errors.New("requires permissions")
	}

	// Obtain deployment details
	d := models.DeployPipelines{}
	err := database.DBConn.Where("pipeline_id = ? and environment_id =? and version = ?", pipelineID, environmentID, version).First(&d).Error

	if err != nil {
		if config.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Delete deployment database error.")
	}

	// Delete the deployment
	p := models.DeployPipelines{}

	err = database.DBConn.Where("pipeline_id = ? and environment_id =? and version = ?", pipelineID, environmentID, version).Delete(&p).Error

	if err != nil {
		if config.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Delete deployment database error.")
	}

	// Delete pipeline's nodes
	n := models.DeployPipelineNodes{}

	err = database.DBConn.Where("pipeline_id = ? and environment_id =? and version = ?", pipelineID, environmentID, version).Delete(&n).Error

	if err != nil {
		if config.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Delete deployment nodes database error.")
	}

	// Delete pipeline's edges
	e := models.DeployPipelineEdges{}

	err = database.DBConn.Where("pipeline_id = ? and environment_id =? and version = ?", pipelineID, environmentID, version).Delete(&e).Error

	if err != nil {
		if config.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Delete deployment edges database error.")
	}

	// Scheduler - remove from leader and from database
	// ----- Delete schedules
	if d.DeployActive == true {
		var plSchedules []*models.Scheduler
		err = database.DBConn.Where("pipeline_id = ? and environment_id =? and run_type = ?", pipelineID, environmentID, "deployment").Find(&plSchedules).Error
		if err != nil && err != gorm.ErrRecordNotFound {
			log.Println("Removal schedules in database - delete pipeline:", err)
		}

		if len(plSchedules) > 0 {
			for _, psc := range plSchedules {
				err := messageq.MsgSend("pipeline-scheduler-delete", psc)
				if err != nil {
					logging.PrintSecretsRedact("NATS error:", err)
				}
			}
		}
	}

	// Remove directory
	// 2. ----- Delete folder and all its contents from directory
	// Also checks that folder belongs to environment ID
	folders := models.DeployCodeFolders{}
	err = database.DBConn.Where("pipeline_id = ? and environment_id =? and version = ? and level=?", pipelineID, environmentID, version, "pipeline").First(&folders).Error

	if err != nil {
		if config.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Delete deployment edges database error.")
	}
	folderpath, _ := filesystem.DeployFolderConstructByID(database.DBConn, folders.FolderID, environmentID, "deployments", version)
	deleteFolder := config.CodeDirectory + folderpath
	if _, err := os.Stat(deleteFolder); os.IsNotExist(err) {

		if config.Debug == "true" {
			log.Println("Directory doesnt exists, skipping delete folder: ", deleteFolder)
		}

	} else {
		if config.Debug == "true" {
			logging.PrintSecretsRedact("Deleting folder: ", deleteFolder)
		}
		err = os.RemoveAll(deleteFolder)
		if err != nil {
			if config.Debug == "true" {
				logging.PrintSecretsRedact(err)
			}
			return "", errors.New("Failed to remove folder and contents.")
		}
	}

	// Remove folders
	f := models.DeployCodeFolders{}

	err = database.DBConn.Where("pipeline_id = ? and environment_id =? and version = ?", pipelineID, environmentID, version).Delete(&f).Error

	if err != nil {
		if config.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Delete deployment edges database error.")
	}

	// Remove files
	fi := models.DeployCodeFiles{}

	err = database.DBConn.Where("pipeline_id = ? and environment_id =? and version = ?", pipelineID, environmentID, version).Delete(&fi).Error

	if err != nil {
		if config.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Delete deployment edges database error.")
	}

	// Remove directory

	response := "Pipeline deleted"
	return response, nil
}

func (r *mutationResolver) TurnOnOffDeployment(ctx context.Context, environmentID string, pipelineID string, online bool) (string, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "admin_environment", ResourceID: environmentID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "specific_deployment", ResourceID: pipelineID, Access: "write", EnvironmentID: environmentID},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return "", errors.New("requires permissions")
	}

	// Get the latest deployment
	d := models.DeployPipelines{}
	err := database.DBConn.Where("pipeline_id = ? AND environment_id = ? and deploy_active = true", pipelineID, environmentID).First(&d).Error
	if err != nil {
		return "", errors.New("Deployment record not found")
	}

	// Get the trigger type
	p := models.DeployPipelineNodes{}
	err = database.DBConn.Where("pipeline_id = ? AND node_type = ? and version = ? and environment_id = ?", pipelineID, "trigger", d.Version, environmentID).First(&p).Error

	if err != nil {
		if config.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Failed to retrieve trigger node.")
	}

	if p.NodeTypeDesc == "play" {
		online = true
	}

	// Update deployment node
	n := models.DeployPipelineNodes{
		TriggerOnline: online,
	}

	err = database.DBConn.Where("pipeline_id = ? and environment_id = ? AND node_type = ? and version = ?", pipelineID, environmentID, "trigger", d.Version).
		Select("trigger_online").Updates(&n).Error

	if err != nil {
		if config.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Failed to update trigger node.")
	}

	// ---- if the trigger is a scheduler, add or remove from the schedule
	// ======= Update the schedule trigger ==========
	if p.NodeTypeDesc == "schedule" {

		var plSchedules []*models.Scheduler
		err := database.DBConn.Where("pipeline_id = ? and environment_id =? and run_type=?", pipelineID, environmentID, "deployment").Find(&plSchedules).Error
		if err != nil && err != gorm.ErrRecordNotFound {
			log.Println("Removal of changed trigger schedules:", err)
		}

		if len(plSchedules) > 0 {
			for _, psc := range plSchedules {

				pipelineSchedules := models.Scheduler{
					NodeID:        psc.NodeID,
					PipelineID:    psc.PipelineID,
					EnvironmentID: psc.EnvironmentID,
					ScheduleType:  psc.ScheduleType,
					Schedule:      psc.Schedule,
					Timezone:      psc.Timezone,
					Online:        online,
					RunType:       "deployment",
				}
				// Add back to schedule
				err := messageq.MsgSend("pipeline-scheduler", pipelineSchedules)
				if err != nil {
					logging.PrintSecretsRedact("NATS error:", err)
				}
			}
		}
	}

	return "Pipeline trigger updated", nil
}

func (r *queryResolver) GetActiveDeployment(ctx context.Context, pipelineID string, environmentID string) (*privategraphql.Deployments, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "admin_environment", ResourceID: environmentID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_all_deployments", ResourceID: platformID, Access: "read", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "specific_deployment", ResourceID: pipelineID, Access: "read", EnvironmentID: environmentID},
	}

	// Permissions baked into the SQL query below
	_, _, admin, adminEnv := permissions.MultiplePermissionChecks(perms)

	p := privategraphql.Deployments{}
	var query string
	if admin == "yes" || adminEnv == "yes" {
		query = `
select
a.pipeline_id, 
a.name,
a.environment_id,
a.from_environment_id,
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
	select node_type, node_type_desc, pipeline_id, trigger_online as online, environment_id, version from deploy_pipeline_nodes where node_type='trigger'
) b on a.pipeline_id=b.pipeline_id and a.environment_id = b.environment_id and a.version = b.version
left join scheduler on scheduler.pipeline_id = a.pipeline_id and scheduler.environment_id = a.environment_id
where a.pipeline_id = ? and a.deploy_active=true and a.environment_id=?
order by a.created_at desc
`

		err := database.DBConn.Raw(
			query, pipelineID, environmentID).Scan(&p).Error

		if err != nil {
			if config.Debug == "true" {
				logging.PrintSecretsRedact(err)
			}
			return nil, errors.New("Retrive pipelines database error.")
		}

	} else {

		query = `select
a.pipeline_id, 
a.name,
a.environment_id,
a.from_environment_id,
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
	select node_type, node_type_desc, pipeline_id, trigger_online as online, environment_id, version from deploy_pipeline_nodes where node_type='trigger'
) b on a.pipeline_id=b.pipeline_id and a.environment_id = b.environment_id and a.version = b.version
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
		p.subject_id = agu.access_group_id and
		agu.user_id = ? and
		p.resource = 'specific_deployment' and
		p.environment_id = agu.environment_id and 
		p.active = true and
		agu.active = true
		)
	) x

) p on p.resource_id = a.pipeline_id and p.environment_id = a.environment_id
left join scheduler on scheduler.pipeline_id = a.pipeline_id and scheduler.environment_id = a.environment_id
where 
a.pipeline_id = ? and a.deploy_active=true and a.environment_id=?
order by a.created_at desc`

		err := database.DBConn.Raw(
			query, currentUser, currentUser, pipelineID, environmentID).Scan(&p).Error

		if err != nil {
			if config.Debug == "true" {
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

func (r *queryResolver) GetDeployment(ctx context.Context, pipelineID string, environmentID string, version string) (*privategraphql.Deployments, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "admin_environment", ResourceID: environmentID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_all_deployments", ResourceID: platformID, Access: "read", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "specific_deployment", ResourceID: pipelineID, Access: "read", EnvironmentID: environmentID},
	}

	// Permissions baked into the SQL query below
	_, _, admin, adminEnv := permissions.MultiplePermissionChecks(perms)

	p := privategraphql.Deployments{}
	var query string
	if admin == "yes" || adminEnv == "yes" {
		query = `
select
a.pipeline_id, 
a.name,
a.environment_id,
a.from_environment_id,
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
	select node_type, node_type_desc, pipeline_id, trigger_online as online, environment_id, version from deploy_pipeline_nodes where node_type='trigger'
) b on a.pipeline_id=b.pipeline_id and a.environment_id = b.environment_id and a.version = b.version
left join scheduler on scheduler.pipeline_id = a.pipeline_id and scheduler.environment_id = a.environment_id
where a.pipeline_id = ? and a.environment_id=? and a.version=?
order by a.created_at desc
`

		err := database.DBConn.Raw(
			query, pipelineID, environmentID, version).Scan(&p).Error

		if err != nil {
			if config.Debug == "true" {
				logging.PrintSecretsRedact(err)
			}
			return nil, errors.New("Retrive pipelines database error.")
		}

	} else {

		query = `select
a.pipeline_id, 
a.name,
a.environment_id,
a.from_environment_id,
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
	select node_type, node_type_desc, pipeline_id, trigger_online as online, environment_id, version from deploy_pipeline_nodes where node_type='trigger'
) b on a.pipeline_id=b.pipeline_id and a.environment_id = b.environment_id and a.version = b.version
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
		p.subject_id = agu.access_group_id and
		agu.user_id = ? and
		p.resource = 'specific_deployment' and
		p.environment_id = agu.environment_id and 
		p.active = true and
		agu.active = true
		)
	) x

) p on p.resource_id = a.pipeline_id and p.environment_id = a.environment_id
left join scheduler on scheduler.pipeline_id = a.pipeline_id and scheduler.environment_id = a.environment_id
where 
a.pipeline_id = ? and a.environment_id=? and a.version=?
order by a.created_at desc`

		err := database.DBConn.Raw(
			query, currentUser, currentUser, pipelineID, environmentID, version).Scan(&p).Error

		if err != nil {
			if config.Debug == "true" {
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
		{Subject: "user", SubjectID: currentUser, Resource: "admin_environment", ResourceID: environmentID, Access: "write", EnvironmentID: environmentID},
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
a.from_environment_id,
a.description,
a.active,
a.worker_group,
a.created_at,
a.version,
a.deploy_active,
b.node_type,
b.node_type_desc,
b.online,
timezone,
scheduler.schedule,
scheduler.schedule_type
from deploy_pipelines a left join (
	select node_type, node_type_desc, pipeline_id, trigger_online as online, version, environment_id from deploy_pipeline_nodes where node_type='trigger'
) b on a.pipeline_id=b.pipeline_id and a.version = b.version and a.environment_id = b.environment_id
left join scheduler on scheduler.pipeline_id = a.pipeline_id and scheduler.environment_id = a.environment_id
where a.environment_id = ?
order by a.created_at desc
`

		err := database.DBConn.Raw(
			query, environmentID).Scan(&p).Error

		if err != nil {
			if config.Debug == "true" {
				logging.PrintSecretsRedact(err)
			}
			return nil, errors.New("Retrive pipelines database error.")
		}

	} else {

		query = `select
a.pipeline_id, 
a.name,
a.environment_id,
a.from_environment_id,
a.description,
a.active,
a.worker_group,
a.created_at,
a.version,
a.deploy_active,
b.node_type,
b.node_type_desc,
b.online,
timezone,
scheduler.schedule,
scheduler.schedule_type
from deploy_pipelines a 
left join (
	select node_type, node_type_desc, pipeline_id, trigger_online as online, version, environment_id from deploy_pipeline_nodes where node_type='trigger'
) b on a.pipeline_id=b.pipeline_id and a.version = b.version and a.environment_id = b.environment_id
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
		p.subject_id = agu.access_group_id and
		agu.user_id = ? and
		p.resource = 'specific_deployment' and
		p.environment_id = agu.environment_id and 
		p.active = true and
		agu.active = true
		)
	) x

) p on p.resource_id = a.pipeline_id and p.environment_id = a.environment_id
left join scheduler on scheduler.pipeline_id = a.pipeline_id and scheduler.environment_id = a.environment_id
where 
a.environment_id = ?
order by a.created_at desc`

		err := database.DBConn.Raw(
			query, currentUser, currentUser, environmentID).Scan(&p).Error

		if err != nil {
			if config.Debug == "true" {
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

func (r *queryResolver) GetDeploymentFlow(ctx context.Context, pipelineID string, environmentID string, version string) (*privategraphql.DeploymentFlow, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "admin_environment", ResourceID: environmentID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_edit_all_pipelines", ResourceID: platformID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "specific_deployment", ResourceID: pipelineID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "specific_deployment", ResourceID: pipelineID, Access: "read", EnvironmentID: environmentID},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return nil, errors.New("requires permissions")
	}

	// ----- Get pipeline nodes
	nodes := []*models.DeployPipelineNodes{}

	err := database.DBConn.Where("pipeline_id = ? and version = ? and environment_id = ?", pipelineID, version, environmentID).Find(&nodes).Error

	if err != nil {
		if config.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("Retrieve pipeline nodes database error")
	}

	// ----- Get pipeline edges
	edges := []*models.DeployPipelineEdges{}

	err = database.DBConn.Where("pipeline_id = ? and version = ? and environment_id = ?", pipelineID, version, environmentID).Find(&edges).Error

	if err != nil {
		if config.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("retrive pipeline edges database error")
	}

	flow := privategraphql.DeploymentFlow{
		Edges: edges,
		Nodes: nodes,
	}

	return &flow, nil
}

func (r *queryResolver) GetNonDefaultWGNodes(ctx context.Context, pipelineID string, fromEnvironmentID string, toEnvironmentID string) ([]*privategraphql.NonDefaultNodes, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	var resp []*privategraphql.NonDefaultNodes

	// ----- Deploy To Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "admin_environment", ResourceID: toEnvironmentID, Access: "write", EnvironmentID: toEnvironmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_deploy_here", ResourceID: platformID, Access: "write", EnvironmentID: toEnvironmentID},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return []*privategraphql.NonDefaultNodes{}, errors.New("Requires permissions: environment_deploy_here")
	}

	// ----- Deploy from Permissions
	perms = []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "admin_environment", ResourceID: fromEnvironmentID, Access: "write", EnvironmentID: fromEnvironmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_deploy_all_pipelines", ResourceID: platformID, Access: "write", EnvironmentID: fromEnvironmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "specific_pipeline", ResourceID: pipelineID, Access: "deploy", EnvironmentID: fromEnvironmentID},
	}

	permOutcome, _, _, _ = permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return []*privategraphql.NonDefaultNodes{}, errors.New("Requires permissions: environment_deploy_all_pipelines")
	}

	var pipelineNodes []*models.PipelineNodes
	err := database.DBConn.Where("pipeline_id =? and environment_id =? and (worker_group = '') IS FALSE", pipelineID, fromEnvironmentID).Find(&pipelineNodes).Error
	if err != nil && err != gorm.ErrRecordNotFound {
		if config.Debug == "true" {
			logging.PrintSecretsRedact(err)
			return []*privategraphql.NonDefaultNodes{}, errors.New("Error retrieving node specific worker groups, try again.")
		}
	}

	for _, n := range pipelineNodes {
		resp = append(resp, &privategraphql.NonDefaultNodes{
			NodeID:        n.NodeID,
			PipelineID:    n.PipelineID,
			Name:          n.Name,
			EnvironmentID: n.EnvironmentID,
			NodeType:      n.NodeType,
			NodeTypeDesc:  n.NodeTypeDesc,
			TriggerOnline: n.TriggerOnline,
			Description:   n.Description,
			WorkerGroup:   n.WorkerGroup,
			Active:        n.Active,
		})
	}
	return resp, nil
}

func (r *queryResolver) GetDeploymentRuns(ctx context.Context, deploymentID string, environmentID string, version string) ([]*models.PipelineRuns, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "admin_environment", ResourceID: environmentID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_run_all_pipelines", ResourceID: platformID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "specific_deployment", ResourceID: deploymentID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "specific_deployment", ResourceID: deploymentID, Access: "read", EnvironmentID: environmentID},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return nil, errors.New("requires permissions")
	}

	// Get pipeline runs
	var pipelineRuns []*models.PipelineRuns
	err := database.DBConn.Order("created_at desc").Limit(20).
		Where("pipeline_id = ? and environment_id = ? and deploy_version = ?", deploymentID, environmentID, version).
		Find(&pipelineRuns).Error
	if err != nil {
		logging.PrintSecretsRedact(err.Error())
	}

	return pipelineRuns, nil
}

// DeploymentEdges returns privategraphql.DeploymentEdgesResolver implementation.
func (r *Resolver) DeploymentEdges() privategraphql.DeploymentEdgesResolver {
	return &deploymentEdgesResolver{r}
}

// DeploymentNodes returns privategraphql.DeploymentNodesResolver implementation.
func (r *Resolver) DeploymentNodes() privategraphql.DeploymentNodesResolver {
	return &deploymentNodesResolver{r}
}

// DeploymentRuns returns privategraphql.DeploymentRunsResolver implementation.
func (r *Resolver) DeploymentRuns() privategraphql.DeploymentRunsResolver {
	return &deploymentRunsResolver{r}
}

type deploymentEdgesResolver struct{ *Resolver }
type deploymentNodesResolver struct{ *Resolver }
type deploymentRunsResolver struct{ *Resolver }
