package privateresolvers

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"context"
	"dataplane/mainapp/auth_permissions"
	"dataplane/mainapp/config"
	"dataplane/mainapp/database"
	"dataplane/mainapp/database/models"
	"dataplane/mainapp/filesystem"
	privategraphql "dataplane/mainapp/graphql/private"
	"dataplane/mainapp/logging"
	"dataplane/mainapp/messageq"
	"dataplane/mainapp/utilities"
	"encoding/json"
	"errors"
	"log"
	"os"
	"strings"
	"time"

	git "github.com/go-git/go-git/v5"
	"github.com/google/uuid"
	jsoniter "github.com/json-iterator/go"
	"gorm.io/gorm"
)

func (r *mutationResolver) AddPipeline(ctx context.Context, name string, environmentID string, description string, workerGroup string) (string, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "platform_environment", ResourceID: platformID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_edit_all_pipelines", ResourceID: platformID, Access: "write", EnvironmentID: environmentID},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return "", errors.New("Requires permissions.")
	}

	pipelineID := uuid.New().String()

	e := models.Pipelines{
		PipelineID:    pipelineID,
		Name:          name,
		Description:   description,
		EnvironmentID: environmentID,
		WorkerGroup:   workerGroup,
		Active:        true,
		UpdateLock:    true,
	}

	err := database.DBConn.Create(&e).Error

	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		if strings.Contains(err.Error(), "duplicate key") {
			return "", errors.New("Pipeline already exists.")
		}
		return "", errors.New("Add pipeline database error.")
	}

	// Give access permissions for the user who added the pipeline
	AccessTypes := models.AccessTypes

	for _, access := range AccessTypes {
		_, err := permissions.CreatePermission(
			"user",
			currentUser,
			"specific_pipeline",
			pipelineID,
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

	}

	var parentfolder models.CodeFolders
	database.DBConn.Where("environment_id = ? and level = ?", environmentID, "environment").First(&parentfolder)

	// Create folder structure for pipeline
	pipelinedir := models.CodeFolders{
		EnvironmentID: environmentID,
		PipelineID:    pipelineID,
		ParentID:      parentfolder.FolderID,
		FolderName:    e.Name,
		Level:         "pipeline",
		FType:         "folder",
		Active:        true,
	}

	// Should create a directory as follows code_directory/
	pfolder, _ := filesystem.FolderConstructByID(database.DBConn, parentfolder.FolderID)
	foldercreate, _, _ := filesystem.CreateFolder(pipelinedir, pfolder)

	thisfolder, _ := filesystem.FolderConstructByID(database.DBConn, foldercreate.FolderID)

	git.PlainInit(config.CodeDirectory+thisfolder, false)

	return pipelineID, nil
}

func (r *mutationResolver) UpdatePipeline(ctx context.Context, pipelineID string, name string, environmentID string, description string, workerGroup string) (string, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "platform_environment", ResourceID: platformID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_edit_all_pipelines", ResourceID: platformID, Access: "write", EnvironmentID: environmentID},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return "", errors.New("Requires permissions.")
	}

	p := models.Pipelines{}

	err := database.DBConn.Where("pipeline_id = ? and environment_id = ?", pipelineID, environmentID).Select("description", "name", "worker_group").
		Updates(models.Pipelines{
			Name:        name,
			Description: description,
			WorkerGroup: workerGroup,
		}).First(&p).Error

	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Update pipeline database error.")
	}

	return "Success", nil
}

func (r *mutationResolver) AddUpdatePipelineFlow(ctx context.Context, input *privategraphql.PipelineFlowInput, environmentID string, pipelineID string) (string, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	var destinations = make(map[string][]string)
	var dependencies = make(map[string][]string)
	var triggerType string = ""
	var pipelineSchedules = models.Scheduler{}

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "platform_environment", ResourceID: platformID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_edit_all_pipelines", ResourceID: platformID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "specific_pipeline", ResourceID: pipelineID, Access: "write", EnvironmentID: environmentID},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return "", errors.New("Requires permissions.")
	}

	// ---- check for duplicate triggers ------
	var triggercount int
	for _, p := range input.NodesInput {

		if p.NodeType == "trigger" {
			triggercount++
		}

	}

	// log.Println(triggercount)

	if triggercount > 1 {

		return "", errors.New("There can only be one trigger.")

	}

	// ---- test for cycle -----
	edges := []*models.PipelineEdges{}

	for _, p := range input.EdgesInput {
		edgeMeta, err := json.Marshal(p.Meta)
		if err != nil {
			logging.PrintSecretsRedact(err)
		}

		edges = append(edges, &models.PipelineEdges{
			EdgeID:        p.EdgeID,
			PipelineID:    pipelineID,
			From:          p.From,
			To:            p.To,
			EnvironmentID: environmentID,
			Meta:          edgeMeta,
			Active:        p.Active,
		})

		// map out dependencies and destinations
		destinations[p.From] = append(destinations[p.From], p.To)
		dependencies[p.To] = append(dependencies[p.To], p.From)

		// if dependencies[p.To] == []{

		// }

	}
	// Obtain the first node in the graph
	var startNode string
	if len(edges) > 0 {
		for _, p := range input.NodesInput {

			if _, ok := dependencies[p.NodeID]; ok {
				//do something here
			} else {
				startNode = p.NodeID
				break
			}
		}

		cycle := utilities.GraphCycleCheck(edges, startNode)
		if cycle == true {
			if config.Debug == "true" {
				logging.PrintSecretsRedact("Cycle detected. Only acyclical pipelines allowed.")
			}
			return "", errors.New("Cycle detected. Only acyclical pipelines allowed.")
		}
	}

	// ----- lock the pipeline
	err := database.DBConn.Model(&models.Pipelines{}).Where("pipeline_id = ?", pipelineID).Update("update_lock", true).Error
	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}

		return "", errors.New("Update pipeline flow edge database error - failed to lock pipeline")
	}

	// ----- Add pipeline nodes to database

	nodes := []models.PipelineNodes{}

	for _, p := range input.NodesInput {

		/* Trigger is online or offline
		Play = online
		Scheduler = based on user input
		*/
		var online bool
		online = false

		// ----- Triggers ----------
		if p.NodeType == "trigger" {

			switch p.NodeTypeDesc {
			case "play":
				online = true
			default:
				// any trigger that is not play e.g. schedule
				online = p.TriggerOnline
			}

			// remove any schedules if the trigger gets changed from schedule to something else.

			// if the trigger is a schedule then register the schedule
			if p.NodeTypeDesc == "schedule" {

				triggerType = "schedule"

				schedulejson, _ := json.Marshal(p.Meta.Data.Genericdata)

				// log.Println("Meta sch:", string(schedulejson))

				timezone := jsoniter.Get(schedulejson, "timezone").ToString()
				schedule := jsoniter.Get(schedulejson, "schedule").ToString()
				scheduleType := jsoniter.Get(schedulejson, "scheduleType").ToString()

				if scheduleType == "cronseconds" {
					timezone = "UTC"
				}
				_, err := time.LoadLocation(timezone)
				if err != nil {
					log.Println("Scheduler timezone error: ", err)
					return "", errors.New("Update pipeline error: Schedule trigger timezone invalid")
				}

				if schedule == "" {
					return "", errors.New("Update pipeline error: Schedule missing")
				}

				if scheduleType == "" {
					return "", errors.New("Update pipeline error: Schedule type missing")
				}

				pipelineSchedules = models.Scheduler{
					NodeID:        p.NodeID,
					PipelineID:    pipelineID,
					EnvironmentID: environmentID,
					ScheduleType:  scheduleType,
					Schedule:      schedule,
					Timezone:      timezone,
					Online:        online,
				}

			}

		}

		nodeMeta, err := json.Marshal(p.Meta)
		if err != nil {
			logging.PrintSecretsRedact(err)
		}

		commandJSON, err := json.Marshal(p.Commands)
		if err != nil {
			logging.PrintSecretsRedact(err)
		}

		dependJSON, err := json.Marshal(dependencies[p.NodeID])
		if err != nil {
			logging.PrintSecretsRedact(err)
		}

		destinationJSON, err := json.Marshal(destinations[p.NodeID])
		if err != nil {
			logging.PrintSecretsRedact(err)
		}

		nodes = append(nodes, models.PipelineNodes{
			NodeID:        p.NodeID,
			PipelineID:    pipelineID,
			Name:          p.Name,
			EnvironmentID: environmentID,
			NodeType:      p.NodeType,
			NodeTypeDesc:  p.NodeTypeDesc,
			WorkerGroup:   p.WorkerGroup,
			Description:   p.Description,
			Commands:      commandJSON,
			Meta:          nodeMeta,
			Dependency:    dependJSON,
			Destination:   destinationJSON,
			Active:        p.Active,
			TriggerOnline: online,
		})

	}

	// ========== Remove the previous graph ==================:
	// ----- Delete old edges
	edge := models.PipelineEdges{}

	err = database.DBConn.Where("pipeline_id = ?", pipelineID).Delete(&edge).Error
	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}

		return "", errors.New("update pipeline flow edge database error")
	}

	// ----- Delete old nodes
	node := models.PipelineNodes{}

	err = database.DBConn.Where("pipeline_id = ?", pipelineID).Delete(&node).Error
	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}

		return "", errors.New("update pipeline flow edge database error")
	}

	// ========== Create the new graph ==================:

	if len(edges) > 0 {

		err = database.DBConn.Create(&edges).Error
	}

	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		if strings.Contains(err.Error(), "duplicate key") {
			return "", errors.New("pipeline flow edge already exists")
		}
		return "", errors.New("add pipeline flow edge database error")
	}

	if len(nodes) > 0 {
		err = database.DBConn.Create(&nodes).Error
	}

	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		if strings.Contains(err.Error(), "duplicate key") {
			return "", errors.New("pipeline flow node already exists")
		}
		return "", errors.New("add pipeline flow node database error")
	}

	// Records original JSON information in database
	JSON, err := json.Marshal(input.JSON)
	if err != nil {
		logging.PrintSecretsRedact(err)
	}

	e := models.Pipelines{
		Json: JSON,
	}

	err = database.DBConn.Where("pipeline_id = ?", pipelineID).Updates(&e).Error

	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Update pipeline database error.")
	}

	// ======= Update the schedule trigger ==========
	if triggerType == "schedule" {
		// Add back to schedule
		err := messageq.MsgSend("pipeline-scheduler", pipelineSchedules)
		if err != nil {
			logging.PrintSecretsRedact("NATS error:", err)
		}

	}

	// ====== create folders =======
	// var parentfolder models.CodeFolders
	// database.DBConn.Where("environment_id = ? and pipeline_id = ? and level = ?", environmentID, pipelineID, "pipeline").First(&parentfolder)

	// pfolder, _ := utilities.FolderConstructByID(parentfolder.FolderID)

	filesystem.FolderNodeAddUpdate(pipelineID, environmentID)

	// ----- unlock the pipeline
	err = database.DBConn.Model(&models.Pipelines{}).Where("pipeline_id = ?", pipelineID).Update("update_lock", false).Error
	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}

		return "", errors.New("Update pipeline flow edge database error - failed to unlock pipeline")
	}

	return "success", nil
}

func (r *mutationResolver) DeletePipeline(ctx context.Context, environmentID string, pipelineID string) (string, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "platform_environment", ResourceID: platformID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "specific_pipeline", ResourceID: pipelineID, Access: "write", EnvironmentID: environmentID},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return "", errors.New("requires permissions")
	}

	// Delete the pipeline
	p := models.Pipelines{}

	err := database.DBConn.Where("pipeline_id = ? and environment_id =?", pipelineID, environmentID).Delete(&p).Error

	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Delete pipeline database error.")
	}

	// Delete pipeline's nodes
	n := models.PipelineNodes{}

	err = database.DBConn.Where("pipeline_id = ? and environment_id =?", pipelineID, environmentID).Delete(&n).Error

	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Delete pipeline nodes database error.")
	}

	// Delete pipeline's edges
	e := models.PipelineEdges{}

	err = database.DBConn.Where("pipeline_id = ? and environment_id =?", pipelineID, environmentID).Delete(&e).Error

	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Delete pipeline edges database error.")
	}

	// Scheduler - remove from leader and from database
	// ----- Delete schedules
	var plSchedules []*models.Scheduler
	err = database.DBConn.Where("pipeline_id = ? and environment_id =?", pipelineID, environmentID).Find(&plSchedules).Error
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

	response := "Pipeline deleted"
	return response, nil
}

func (r *mutationResolver) TurnOnOffPipeline(ctx context.Context, environmentID string, pipelineID string, online bool) (string, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "platform_environment", ResourceID: platformID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "specific_pipeline", ResourceID: pipelineID, Access: "write", EnvironmentID: environmentID},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return "", errors.New("requires permissions")
	}

	// Get the trigger type
	p := models.PipelineNodes{}

	err := database.DBConn.Where("pipeline_id = ? AND node_type = ?", pipelineID, "trigger").Find(&p).Error

	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Failed to retrieve trigger node.")
	}

	if p.NodeTypeDesc == "play" {
		online = true
	}

	// Update node
	n := models.PipelineNodes{
		TriggerOnline: online,
	}

	err = database.DBConn.Where("pipeline_id = ? AND node_type = ?", pipelineID, "trigger").
		Select("trigger_online").Updates(&n).Error

	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Failed to update trigger node.")
	}

	// ---- if the trigger is a scheduler, add or remove from the schedule
	// ======= Update the schedule trigger ==========
	if p.NodeTypeDesc == "schedule" {

		var plSchedules []*models.Scheduler
		err := database.DBConn.Where("pipeline_id = ?", pipelineID).Find(&plSchedules).Error
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

func (r *pipelineEdgesResolver) Meta(ctx context.Context, obj *models.PipelineEdges) (interface{}, error) {
	return obj.Meta, nil
}

func (r *pipelineNodesResolver) Commands(ctx context.Context, obj *models.PipelineNodes) (interface{}, error) {
	return obj.Commands, nil
}

func (r *pipelineNodesResolver) Meta(ctx context.Context, obj *models.PipelineNodes) (interface{}, error) {
	return obj.Meta, nil
}

func (r *queryResolver) GetPipeline(ctx context.Context, pipelineID string, environmentID string) (*privategraphql.Pipelines, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "platform_environment", ResourceID: platformID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_all_pipelines", ResourceID: platformID, Access: "read", EnvironmentID: environmentID},
	}

	_, _, admin, adminEnv := permissions.MultiplePermissionChecks(perms)

	// if permOutcome == "denied" {
	// 	return []*privategraphql.Pipelines{}, nil
	// }

	p := privategraphql.Pipelines{}
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
b.node_type,
b.node_type_desc,
b.online,
scheduler.schedule,
scheduler.schedule_type
from pipelines a left join (
	select node_type, node_type_desc, pipeline_id, trigger_online as online from pipeline_nodes where node_type='trigger'
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
b.online,
scheduler.schedule,
scheduler.schedule_type
from pipelines a 
left join (
	select node_type, node_type_desc, pipeline_id, trigger_online as online from pipeline_nodes where node_type='trigger'
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
		p.resource = 'specific_pipeline' and
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
		p.resource = 'specific_pipeline' and
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

func (r *queryResolver) GetPipelines(ctx context.Context, environmentID string) ([]*privategraphql.Pipelines, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "platform_environment", ResourceID: platformID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_all_pipelines", ResourceID: platformID, Access: "read", EnvironmentID: environmentID},
	}

	_, _, admin, adminEnv := permissions.MultiplePermissionChecks(perms)

	// if permOutcome == "denied" {
	// 	return []*privategraphql.Pipelines{}, nil
	// }

	p := []*privategraphql.Pipelines{}
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
from pipelines a left join (
	select node_type, node_type_desc, pipeline_id, trigger_online as online from pipeline_nodes where node_type='trigger'
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
from pipelines a 
left join (
	select node_type, node_type_desc, pipeline_id, trigger_online as online from pipeline_nodes where node_type='trigger'
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
		p.resource = 'specific_pipeline' and
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
		p.resource = 'specific_pipeline' and
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

func (r *queryResolver) GetPipelineFlow(ctx context.Context, pipelineID string, environmentID string) (*privategraphql.PipelineFlow, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "platform_environment", ResourceID: platformID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_edit_all_pipelines", ResourceID: platformID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "specific_pipeline", ResourceID: pipelineID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "specific_pipeline", ResourceID: pipelineID, Access: "read", EnvironmentID: environmentID},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return nil, errors.New("requires permissions")
	}

	// ----- Get pipeline nodes
	nodes := []*models.PipelineNodes{}

	err := database.DBConn.Where("pipeline_id = ?", pipelineID).Find(&nodes).Error

	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("retrive pipeline nodes database error")
	}

	// ----- Get pipeline edges
	edges := []*models.PipelineEdges{}

	err = database.DBConn.Where("pipeline_id = ?", pipelineID).Find(&edges).Error

	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("retrive pipeline edges database error")
	}

	flow := privategraphql.PipelineFlow{
		Edges: edges,
		Nodes: nodes,
	}

	return &flow, nil
}

// PipelineEdges returns privategraphql.PipelineEdgesResolver implementation.
func (r *Resolver) PipelineEdges() privategraphql.PipelineEdgesResolver {
	return &pipelineEdgesResolver{r}
}

// PipelineNodes returns privategraphql.PipelineNodesResolver implementation.
func (r *Resolver) PipelineNodes() privategraphql.PipelineNodesResolver {
	return &pipelineNodesResolver{r}
}

type pipelineEdgesResolver struct{ *Resolver }
type pipelineNodesResolver struct{ *Resolver }
