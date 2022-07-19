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
	gonanoid "github.com/matoous/go-nanoid/v2"
	"gorm.io/gorm"
)

func (r *mutationResolver) AddPipeline(ctx context.Context, name string, environmentID string, description string, workerGroup string) (string, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "admin_environment", ResourceID: environmentID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_edit_all_pipelines", ResourceID: environmentID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_create_pipelines", ResourceID: environmentID, Access: "write", EnvironmentID: environmentID},
	}

	permOutcome, outcomes, _, _ := permissions.MultiplePermissionChecks(perms)

	for _, outcome := range outcomes {
		if outcome.Perm.Resource == "environment_edit_all_pipelines" && outcome.Result == "grant" {
			permOutcome = "yes"
		}
	}

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
		if config.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		if strings.Contains(err.Error(), "duplicate key") {
			return "", errors.New("Pipeline already exists.")
		}
		return "", errors.New("Add pipeline database error.")
	}

	// Give access permissions for the user who added the pipeline
	AccessTypes := models.PipelineAccessTypes

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
			if config.Debug == "true" {
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
	pfolder, _ := filesystem.FolderConstructByID(database.DBConn, parentfolder.FolderID, environmentID, "pipelines")

	foldercreate, _, _ := filesystem.CreateFolder(pipelinedir, pfolder+"pipelines/")

	thisfolder, _ := filesystem.FolderConstructByID(database.DBConn, foldercreate.FolderID, environmentID, "pipelines")

	git.PlainInit(config.CodeDirectory+thisfolder, false)

	return pipelineID, nil
}

func (r *mutationResolver) UpdatePipeline(ctx context.Context, pipelineID string, name string, environmentID string, description string, workerGroup string) (string, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "admin_environment", ResourceID: environmentID, Access: "write", EnvironmentID: environmentID},
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
		if config.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Update pipeline database error.")
	}

	// Update folder structure for environment
	var parentfolder models.CodeFolders
	database.DBConn.Where("level = ? and environment_id = ?", "environment", environmentID).First(&parentfolder)

	pfolder, _ := filesystem.FolderConstructByID(database.DBConn, parentfolder.FolderID, environmentID, "pipelines")

	// log.Println("Parent folder:", pfolder)

	var oldfolder models.CodeFolders
	database.DBConn.Where("environment_id = ? and level = ? and pipeline_id =?", environmentID, "pipeline", pipelineID).First(&oldfolder)

	// log.Println("Old folder:", oldfolder.FolderID, oldfolder.FolderName)
	if oldfolder.FolderID == "" {
		return "", errors.New("Update pipeline folder error.")
	}

	OLDinput := models.CodeFolders{
		EnvironmentID: oldfolder.EnvironmentID,
		ParentID:      parentfolder.FolderID,
		FolderName:    oldfolder.FolderName,
		Level:         "pipeline",
		FType:         "folder",
		Active:        true,
	}

	Newinput := models.CodeFolders{
		EnvironmentID: oldfolder.EnvironmentID,
		ParentID:      parentfolder.FolderID,
		FolderName:    name,
		Level:         "pipeline",
		FType:         "folder",
		Active:        true,
	}
	filesystem.UpdateFolder(oldfolder.FolderID, OLDinput, Newinput, pfolder+"pipelines/")

	return "Success", nil
}

func (r *mutationResolver) DuplicatePipeline(ctx context.Context, pipelineID string, name string, environmentID string, description string, workerGroup string) (string, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "admin_environment", ResourceID: environmentID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_edit_all_pipelines", ResourceID: platformID, Access: "write", EnvironmentID: environmentID},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return "", errors.New("Requires permissions.")
	}

	// Obtain pipeline details
	// ----- Get pipeline
	pipeline := models.Pipelines{}
	err := database.DBConn.Where("pipeline_id = ? and environment_id = ?", pipelineID, environmentID).First(&pipeline).Error
	if err != nil {
		if config.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Duplicate pipeline: Retrieve pipeline database error")
	}

	pipelineNodes := []*models.PipelineNodes{}
	err = database.DBConn.Where("pipeline_id = ? and environment_id = ?", pipelineID, environmentID).Find(&pipelineNodes).Error
	if err != nil {
		if config.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Retrieve pipeline database error")
	}

	pipelineEdges := []*models.PipelineEdges{}
	err = database.DBConn.Where("pipeline_id = ? and environment_id = ?", pipelineID, environmentID).Find(&pipelineEdges).Error
	if err != nil {
		if config.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Retrieve pipeline database error")
	}

	folders := []*models.CodeFolders{}
	err = database.DBConn.Where("pipeline_id = ? and environment_id = ?", pipelineID, environmentID).Find(&folders).Error
	if err != nil {
		if config.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Retrieve pipeline folders database error")
	}

	files := []*models.CodeFiles{}
	err = database.DBConn.Where("pipeline_id = ? and environment_id = ?", pipelineID, environmentID).Find(&files).Error
	if err != nil {
		if config.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Retrieve pipeline folders database error")
	}

	// Obtain folder structure for pipeline
	pipelineFolder := models.CodeFolders{}
	err = database.DBConn.Where("pipeline_id = ? and environment_id = ? and level = ?", pipelineID, environmentID, "pipeline").First(&pipelineFolder).Error
	if err != nil {
		if config.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Retrieve pipeline folders database error")
	}

	// pfolderExisting, _ := filesystem.FolderConstructByID(database.DBConn, pipelineFolder.ParentID, environmentID, "")
	foldertocopy, _ := filesystem.FolderConstructByID(database.DBConn, pipelineFolder.FolderID, environmentID, "pipelines")

	foldertocopy = config.CodeDirectory + foldertocopy
	// destinationfolder := config.CodeDirectory + pfolderExisting + "deployments/" + pipelineFolder.FolderID + "_" + pipelineFolder.FolderName + "/" + version + "/"
	// log.Println("Folder to copy:", foldertocopy)
	// log.Println("Destination folder:", destinationfolder)

	// ----------- Reconstruct IDs ----------

	pipelineIDNew := uuid.New().String()

	e := models.Pipelines{
		PipelineID:    pipelineIDNew,
		Name:          name,
		Description:   description,
		EnvironmentID: environmentID,
		WorkerGroup:   workerGroup,
		Meta:          pipeline.Meta,
		Active:        true,
		UpdateLock:    true,
	}

	// Give access permissions for the user who added the pipeline
	AccessTypes := models.PipelineAccessTypes

	for _, access := range AccessTypes {
		_, err := permissions.CreatePermission(
			"user",
			currentUser,
			"specific_pipeline",
			pipelineIDNew,
			access,
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

	var parentfolder models.CodeFolders
	database.DBConn.Where("environment_id = ? and level = ?", environmentID, "environment").First(&parentfolder)

	// Create folder structure for pipeline based on environment ID
	pipelinedir := models.CodeFolders{
		EnvironmentID: environmentID,
		PipelineID:    pipelineIDNew,
		ParentID:      parentfolder.FolderID,
		FolderName:    e.Name,
		Level:         "pipeline",
		FType:         "folder",
		Active:        true,
	}

	// Should create a directory as follows code_directory/
	pfolder, _ := filesystem.FolderConstructByID(database.DBConn, parentfolder.FolderID, environmentID, "pipelines")

	foldercreate, _, _ := filesystem.CreateFolder(pipelinedir, pfolder+"pipelines/")

	// Takes folder ID generated from create folder
	thisfolder, _ := filesystem.FolderConstructByID(database.DBConn, foldercreate.FolderID, environmentID, "pipelines")

	git.PlainInit(config.CodeDirectory+thisfolder, false)

	// ---------- Move across all the files --------------

	destinationfolder := config.CodeDirectory + thisfolder

	// // Create a folder for the version and copy files across
	err = utilities.CopyDirectory(foldertocopy, destinationfolder)
	if err != nil {
		if config.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Failed to copy deployment files.")
	}

	// Copy pipeline, nodes and edges

	// Pipeline
	// updatePipeline := models.Pipelines{
	// 	PipelineID:        "d-" + pipeline.PipelineID,
	// 	Version:           version,
	// 	DeployActive:      false,
	// 	Name:              pipeline.Name,
	// 	EnvironmentID:     toEnvironmentID,
	// 	FromEnvironmentID: fromEnvironmentID,
	// 	FromPipelineID:    pipeline.PipelineID,
	// 	Description:       pipeline.Description,
	// 	Active:            pipeline.Active,
	// 	WorkerGroup:       workerGroup,
	// 	Meta:              pipeline.Meta,
	// 	Json:              pipeline.Json,
	// 	UpdateLock:        true,
	// }

	// // Recalculate edge dependencies and destinations with new d- ID
	var destinations = make(map[string][]string)
	var dependencies = make(map[string][]string)
	var edgeOLDNew = make(map[string]string)
	var nodesOLDNew = make(map[string]string)
	var folderIDOLDNew = make(map[string]string)
	var foldersOLDNew = make(map[string]models.FolderDuplicate)

	// Convert pipeline json to string
	var jsonstring string
	// json.Unmarshal([]byte(pipeline.Json), &jsonstring)

	jsonstring = string(pipeline.Json)

	jsonstring = strings.ReplaceAll(jsonstring, pipelineID, e.PipelineID)

	// remap the edge IDs
	for _, edge := range pipelineEdges {
		edgeOLDNew[edge.EdgeID] = uuid.NewString()
		jsonstring = strings.ReplaceAll(jsonstring, edge.EdgeID, edgeOLDNew[edge.EdgeID])
	}

	for _, node := range pipelineNodes {
		nodesOLDNew[node.NodeID] = uuid.NewString()
		jsonstring = strings.ReplaceAll(jsonstring, node.NodeID, nodesOLDNew[node.NodeID])
	}

	var foldercheck models.CodeFolders
	var existingPipelineFolderID string
	var existingPipelineFolderName string

	// Regenerate folder IDs
	for _, n := range folders {

		// Use ID of created pipeline folder if at pipeline level
		if n.Level == "pipeline" {
			folderIDOLDNew[n.FolderID] = foldercreate.FolderID
			existingPipelineFolderID = n.FolderID
			existingPipelineFolderName = n.FolderName
		} else {
			for i := 1; i < 5; i++ {

				id, err := gonanoid.Generate("1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ", 7)
				if err != nil {
					if config.Debug == "true" {
						log.Println("Directory id error:", err)
					}
					continue
				}

				database.DBConn.Select("folder_id").Where("folder_id=?", id).First(&foldercheck)

				// Check if ID already exists
				if foldercheck.FolderID != "" {
					continue
				}

				folderIDOLDNew[n.FolderID] = id

			}
		}

		// log.Println("FolderID Map", n.FolderID, folderIDOLDNew[n.FolderID])

	}

	// // Edges
	deployEdges := []*models.PipelineEdges{}
	for _, edge := range pipelineEdges {
		deployEdges = append(deployEdges, &models.PipelineEdges{
			EdgeID:        edgeOLDNew[edge.EdgeID],
			PipelineID:    pipelineIDNew,
			From:          nodesOLDNew[edge.From],
			To:            nodesOLDNew[edge.To],
			EnvironmentID: environmentID,
			Meta:          edge.Meta,
			Active:        edge.Active,
		})

		// map out dependencies and destinations
		destinations[nodesOLDNew[edge.From]] = append(destinations[nodesOLDNew[edge.From]], nodesOLDNew[edge.To])
		dependencies[nodesOLDNew[edge.To]] = append(dependencies[nodesOLDNew[edge.To]], nodesOLDNew[edge.From])
	}

	var triggerType string
	// // Map
	// var nodeworkergroupmap = make(map[string]string)
	// for _, nwg := range nodeWorkerGroup {
	// 	nodeworkergroupmap[nwg.NodeID] = nwg.WorkerGroup
	// }
	// // Nodes
	// var online bool
	deployNodes := []*models.PipelineNodes{}
	for _, node := range pipelineNodes {

		dependJSON, err := json.Marshal(dependencies[nodesOLDNew[node.NodeID]])
		if err != nil {
			logging.PrintSecretsRedact(err)
		}

		destinationJSON, err := json.Marshal(destinations[nodesOLDNew[node.NodeID]])
		if err != nil {
			logging.PrintSecretsRedact(err)
		}

		// 	var workergroupassign string
		// 	if _, ok := nodeworkergroupmap[node.NodeID]; ok {
		// 		workergroupassign = nodeworkergroupmap[node.NodeID]
		// 	} else {
		// 		workergroupassign = workerGroup
		// 	}

		// 	//Assign an online value
		// 	if node.NodeTypeDesc == "play" {
		// 		online = true
		// 	} else {
		// 		if node.NodeType == "trigger" {
		// 			online = liveactive
		// 		} else {
		// 			online = node.TriggerOnline
		// 		}

		// 	}

		if node.NodeType == "trigger" && node.NodeTypeDesc == "schedule" {
			triggerType = "schedule"
		}

		deployNodes = append(deployNodes, &models.PipelineNodes{
			NodeID:        nodesOLDNew[node.NodeID],
			PipelineID:    pipelineIDNew,
			Name:          node.Name,
			EnvironmentID: environmentID,
			NodeType:      node.NodeType,
			NodeTypeDesc:  node.NodeTypeDesc,
			TriggerOnline: node.TriggerOnline,
			Description:   node.Description,
			Commands:      node.Commands,
			Meta:          node.Meta,

			// Needs to be recalculated
			Dependency:  dependJSON,
			Destination: destinationJSON,

			// Needs to updated via front end sub nodes
			WorkerGroup: node.WorkerGroup,
			Active:      node.Active,
		})
	}

	// // folders
	deployFolders := []*models.CodeFolders{}
	for _, n := range folders {

		foldersOLDNew[n.FolderID] = models.FolderDuplicate{}

		// Pipeline level has already been created
		if n.Level != "pipeline" {
			deployFolders = append(deployFolders, &models.CodeFolders{
				FolderID:      folderIDOLDNew[n.FolderID],
				ParentID:      folderIDOLDNew[n.ParentID],
				EnvironmentID: environmentID,
				PipelineID:    pipelineIDNew,
				NodeID:        nodesOLDNew[n.NodeID],
				FolderName:    n.FolderName,
				Level:         n.Level,
				FType:         n.FType,
				Active:        n.Active,
			})

			log.Println("ParentID, FolderID", folderIDOLDNew[n.ParentID], folderIDOLDNew[n.FolderID])
		}

	}

	deployFiles := []*models.CodeFiles{}
	for _, n := range files {
		deployFiles = append(deployFiles, &models.CodeFiles{
			FileID:        uuid.NewString(),
			FolderID:      folderIDOLDNew[n.FolderID],
			EnvironmentID: environmentID,
			PipelineID:    pipelineIDNew,
			NodeID:        nodesOLDNew[n.NodeID],
			FileName:      n.FileName,
			Level:         n.Level,
			FType:         n.FType,
			Active:        n.Active,
		})
	}
	// log.Println(jsonstring)
	var res interface{}
	json.Unmarshal([]byte(jsonstring), &res)
	pipelineJSON, err := json.Marshal(res)
	if err != nil {
		logging.PrintSecretsRedact(err)
	}
	e.Json = pipelineJSON

	// // Pipeline create
	err = database.DBConn.Create(&e).Error
	if err != nil {
		if config.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Failed to create duplicate pipeline.")
	}

	// // Nodes create
	err = database.DBConn.Create(&deployNodes).Error
	if err != nil {
		if config.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Failed to create duplicate pipeline.")
	}

	// // Edges create
	if len(deployEdges) > 0 {
		err = database.DBConn.Create(&deployEdges).Error
		if err != nil {
			if config.Debug == "true" {
				logging.PrintSecretsRedact(err)
			}
			return "", errors.New("Failed to create duplicate pipeline.")
		}
	}

	// // Folders create
	if len(deployFolders) > 0 {
		err = database.DBConn.Create(&deployFolders).Error
		if err != nil {
			if config.Debug == "true" {
				logging.PrintSecretsRedact(err)
			}
			return "", errors.New("Failed to create deployment pipeline.")
		}
	}

	// Rename the folders
	for _, n := range folders {

		if n.Level != "pipeline" {
			fromFolder, _ := filesystem.FolderConstructByID(database.DBConn, n.FolderID, environmentID, "pipelines")
			toFolder, _ := filesystem.FolderConstructByID(database.DBConn, folderIDOLDNew[n.FolderID], environmentID, "pipelines")

			// The folders are already copied into the new directoy, we need to reference that directory and not the existing one

			// log.Println("From:", fromFolder)
			// log.Println("From:", existingPipelineFolderID, folderIDOLDNew[existingPipelineFolderID])

			fromFolder = strings.ReplaceAll(config.CodeDirectory+fromFolder, existingPipelineFolderID+"_"+existingPipelineFolderName, folderIDOLDNew[existingPipelineFolderID]+"_"+foldercreate.FolderName)

			// log.Println("From:", fromFolder)

			toFolder = config.CodeDirectory + toFolder

			if _, err := os.Stat(fromFolder); os.IsNotExist(err) {
				// path/to/whatever does not exist
				if config.Debug == "true" {
					log.Println("Update directory doesn't exist: ", fromFolder)
				}
				return "", errors.New("Failed to find existing pipeline directory. Duplicated pipeline will not work.")

			} else {
				err = os.Rename(fromFolder, toFolder)
				if err != nil {
					log.Println("Rename pipeline dir err:", err)
				}
				if config.Debug == "true" {
					log.Println("Directory change: ", fromFolder, "->", toFolder)
				}
			}
		}

	}
	// // Files create
	if len(deployFiles) > 0 {
		err = database.DBConn.Create(&deployFiles).Error
		if err != nil {
			if config.Debug == "true" {
				logging.PrintSecretsRedact(err)
			}
			return "", errors.New("Failed to create deployment pipeline.")
		}
	}

	// // Add back to schedule
	// // ======= Update the schedule trigger ==========
	if triggerType == "schedule" {
		// Add back to schedule
		var plSchedules []*models.Scheduler

		// Adding an existing schedule from pipeline into deployment - needs to select pipeline
		err := database.DBConn.Where("pipeline_id = ? and environment_id =? and run_type=?", pipelineID, environmentID, "pipeline").Find(&plSchedules).Error
		if err != nil && err != gorm.ErrRecordNotFound {
			log.Println("Removal of changed trigger schedules:", err)
		}

		if len(plSchedules) > 0 {
			for _, psc := range plSchedules {

				pipelineSchedules := models.Scheduler{
					NodeID:        nodesOLDNew[psc.NodeID],
					PipelineID:    pipelineIDNew,
					EnvironmentID: environmentID,
					ScheduleType:  psc.ScheduleType,
					Schedule:      psc.Schedule,
					Timezone:      psc.Timezone,
					Online:        psc.Online,
					RunType:       "pipeline",
				}
				// Add back to schedule
				err := messageq.MsgSend("pipeline-scheduler", pipelineSchedules)
				if err != nil {
					logging.PrintSecretsRedact("NATS error:", err)
				}
			}
		}

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
		{Subject: "user", SubjectID: currentUser, Resource: "admin_environment", ResourceID: environmentID, Access: "write", EnvironmentID: environmentID},
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
			Active:        true,
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
		if config.Debug == "true" {
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
					RunType:       "pipeline",
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
			Active:        true,
			TriggerOnline: online,
		})

	}

	// ========== Remove the previous graph ==================:
	// ----- Delete old edges
	edge := models.PipelineEdges{}

	err = database.DBConn.Where("pipeline_id = ?", pipelineID).Delete(&edge).Error
	if err != nil {
		if config.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}

		return "", errors.New("update pipeline flow edge database error")
	}

	// ----- Delete old nodes
	node := models.PipelineNodes{}

	err = database.DBConn.Where("pipeline_id = ?", pipelineID).Delete(&node).Error
	if err != nil {
		if config.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}

		return "", errors.New("update pipeline flow edge database error")
	}

	// ========== Create the new graph ==================:

	if len(edges) > 0 {

		err = database.DBConn.Create(&edges).Error
	}

	if err != nil {
		if config.Debug == "true" {
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
		if config.Debug == "true" {
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
		if config.Debug == "true" {
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

	filesystem.FolderNodeAddUpdate(pipelineID, environmentID, "pipelines")

	// ----- unlock the pipeline
	err = database.DBConn.Model(&models.Pipelines{}).Where("pipeline_id = ?", pipelineID).Update("update_lock", false).Error
	if err != nil {
		if config.Debug == "true" {
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
		{Subject: "user", SubjectID: currentUser, Resource: "admin_environment", ResourceID: environmentID, Access: "write", EnvironmentID: environmentID},
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
		if config.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Delete pipeline database error.")
	}

	// Delete pipeline's nodes
	n := models.PipelineNodes{}

	err = database.DBConn.Where("pipeline_id = ? and environment_id =?", pipelineID, environmentID).Delete(&n).Error

	if err != nil {
		if config.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Delete pipeline nodes database error.")
	}

	// Delete pipeline's edges
	e := models.PipelineEdges{}

	err = database.DBConn.Where("pipeline_id = ? and environment_id =?", pipelineID, environmentID).Delete(&e).Error

	if err != nil {
		if config.Debug == "true" {
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
		{Subject: "user", SubjectID: currentUser, Resource: "admin_environment", ResourceID: environmentID, Access: "write", EnvironmentID: environmentID},
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
		if config.Debug == "true" {
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
		if config.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", errors.New("Failed to update trigger node.")
	}

	// ---- if the trigger is a scheduler, add or remove from the schedule
	// ======= Update the schedule trigger ==========
	if p.NodeTypeDesc == "schedule" {

		var plSchedules []*models.Scheduler
		err := database.DBConn.Where("pipeline_id = ? and environment_id =?", pipelineID, environmentID).Find(&plSchedules).Error
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
					RunType:       "pipeline",
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
		{Subject: "user", SubjectID: currentUser, Resource: "admin_environment", ResourceID: environmentID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_all_pipelines", ResourceID: platformID, Access: "read", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "specific_pipeline", ResourceID: pipelineID, Access: "read", EnvironmentID: environmentID},
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
		p.subject_id = agu.access_group_id and
		agu.user_id = ? and
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

func (r *queryResolver) GetPipelines(ctx context.Context, environmentID string) ([]*privategraphql.Pipelines, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "admin_environment", ResourceID: environmentID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_all_pipelines", ResourceID: environmentID, Access: "read", EnvironmentID: environmentID},
	}

	_, outcomes, admin, adminEnv := permissions.MultiplePermissionChecks(perms)

	envPipelines := "no"
	for _, outcome := range outcomes {
		if outcome.Perm.Resource == "environment_all_pipelines" && outcome.Result == "grant" {
			envPipelines = "yes"
		}
	}

	// if permOutcome == "denied" {
	// 	return []*privategraphql.Pipelines{}, nil
	// }

	p := []*privategraphql.Pipelines{}
	var query string
	if admin == "yes" || adminEnv == "yes" || envPipelines == "yes" {
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
timezone,
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
a.description,
a.active,
a.worker_group,
a.created_at,
b.node_type,
b.node_type_desc,
b.online,
timezone,
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
		p.subject_id = agu.access_group_id and
		agu.user_id = ? and
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

func (r *queryResolver) GetPipelineFlow(ctx context.Context, pipelineID string, environmentID string) (*privategraphql.PipelineFlow, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "admin_environment", ResourceID: environmentID, Access: "write", EnvironmentID: environmentID},
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
		if config.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("Retrieve pipeline nodes database error")
	}

	// ----- Get pipeline edges
	edges := []*models.PipelineEdges{}

	err = database.DBConn.Where("pipeline_id = ?", pipelineID).Find(&edges).Error

	if err != nil {
		if config.Debug == "true" {
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

func (r *queryResolver) GetNode(ctx context.Context, nodeID string, environmentID string, pipelineID string) (*models.PipelineNodes, error) {
	currentUser := ctx.Value("currentUser").(string)
	platformID := ctx.Value("platformID").(string)

	// ----- Permissions
	perms := []models.Permissions{
		{Subject: "user", SubjectID: currentUser, Resource: "admin_platform", ResourceID: platformID, Access: "write", EnvironmentID: "d_platform"},
		{Subject: "user", SubjectID: currentUser, Resource: "admin_environment", ResourceID: environmentID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "environment_edit_all_pipelines", ResourceID: platformID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "specific_pipeline", ResourceID: pipelineID, Access: "write", EnvironmentID: environmentID},
		{Subject: "user", SubjectID: currentUser, Resource: "specific_pipeline", ResourceID: pipelineID, Access: "read", EnvironmentID: environmentID},
	}

	permOutcome, _, _, _ := permissions.MultiplePermissionChecks(perms)

	if permOutcome == "denied" {
		return nil, errors.New("requires permissions")
	}

	// ----- Get pipeline nodes
	nodes := models.PipelineNodes{}

	err := database.DBConn.Where("node_id = ? and environment_id = ?", nodeID, environmentID).Find(&nodes).Error

	if err != nil {
		if config.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return nil, errors.New("Retrieve pipeline nodes database error")
	}

	return &nodes, nil
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
