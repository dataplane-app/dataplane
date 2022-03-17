package utilities

import (
	"dataplane/mainapp/config"
	"dataplane/mainapp/database"
	"dataplane/mainapp/database/models"
	"log"
)

type FolderNodeUpdate struct {
	NodeID     string `json:"node_id"`
	Name       string `json:"name"`
	NodeType   string `json:"node_type"`
	FolderID   string `json:"folder_id"`
	FolderName string `json:"folder_name"`
	Action     string `json:"action"`
}

func FolderNodeAddUpdate(pipelineID string, environmentID string) {

	/*
		Pipeline nodes have been updated.
		Folder structure and db has not been updated.
		Compare the two for updates.
	*/
	var parentfolder models.CodeFolders
	database.DBConn.Where("environment_id = ? and pipeline_id = ? and level = ?", environmentID, pipelineID, "pipeline").First(&parentfolder)

	pfolder, _ := FolderConstructByID(parentfolder.FolderID)

	var output []FolderNodeUpdate
	database.DBConn.Debug().Raw(`
	select 
	p.node_id,
	p.name,
	p.node_type,
	f.folder_id,
	f.folder_name
	from pipeline_nodes p 
	left join code_folders f on p.pipeline_id = f.pipeline_id and p.node_id = f.node_id and f.level='node'
	where p.pipeline_id =? and p.environment_id = ?
	`, pipelineID, environmentID).Scan(&output)

	for _, n := range output {

		if n.NodeType == "trigger" {
			n.Name = "trigger"
		}

		// Where there is no folder id - need to add
		if n.FolderID == "" {
			n.Action = "add"

			// Create folder structure for nodes
			pipelinedir := models.CodeFolders{
				EnvironmentID: environmentID,
				PipelineID:    pipelineID,
				NodeID:        n.NodeID,
				ParentID:      parentfolder.FolderID,
				FolderName:    n.Name,
				Level:         "node",
				FType:         "folder",
				Active:        true,
			}

			_, cf := CreateFolder(pipelinedir, pfolder)

			if config.Debug == "true" {
				log.Println("Add node directory: ", cf)
			}

		} else {
			// Do we need to update existing folders

			// Has the folder name changed?
			if n.FolderName != FolderFriendly(n.Name) {
				n.Action = "update"
				OLDinput := models.CodeFolders{
					EnvironmentID: environmentID,
					PipelineID:    pipelineID,
					NodeID:        n.NodeID,
					ParentID:      parentfolder.FolderID,
					FolderName:    n.FolderName,
					Level:         "node",
					FType:         "folder",
					Active:        true,
				}

				Newinput := models.CodeFolders{
					EnvironmentID: environmentID,
					PipelineID:    pipelineID,
					NodeID:        n.NodeID,
					ParentID:      parentfolder.FolderID,
					FolderName:    n.Name,
					Level:         "node",
					FType:         "folder",
					Active:        true,
				}
				UpdateFolder(n.FolderID, OLDinput, Newinput, pfolder)

			} else {
				n.Action = "nochange"
				if config.Debug == "true" {
					log.Println("No change node directory: ", n.FolderID, n.NodeID)
				}
			}

		}

		// output[i].Name = FolderFriendly(n.Name)

	}
}
