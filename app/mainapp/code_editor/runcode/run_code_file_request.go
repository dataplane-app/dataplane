package runcode

import (
	"errors"
	"log"

	"github.com/dataplane-app/dataplane/app/mainapp/code_editor/filesystem"
	"github.com/dataplane-app/dataplane/app/mainapp/database"
	"github.com/dataplane-app/dataplane/app/mainapp/database/models"

	"github.com/google/uuid"
)

type Command struct {
	Command string `json:command`
}

/*
Task status: Queue, Allocated, Started, Failed, Success
*/
func RunCodeFile(workerGroup string, fileID string, envID string, pipelineID string, nodeID string, nodeTypeDesc string, runid string, replayRunID string) (models.CodeRun, error) {

	// Important not to update status to avoid timing issue where it can overwrite a success a status
	if runid == "" {
		runid = uuid.NewString()
	}

	// if dpconfig.Debug == "true" {
	// 	if _, err := os.Stat(dpconfig.CodeDirectory + folderMap); os.IsExist(err) {
	// 		log.Println("Dir exists:", dpconfig.CodeDirectory+folderMap)

	// 	}
	// }

	// ------ Construct run command
	var commands []string
	var runSend models.CodeRun
	switch nodeTypeDesc {

	/* ------------------------ Python node -------------------------- */
	case "python":

		// ------ Obtain the file name
		filesdata := models.CodeFiles{}
		dberror := database.DBConn.Select("file_name").Where("file_id = ? and environment_id =? and level = ?", fileID, envID, "node_file").Find(&filesdata).Error
		if dberror != nil {
			rerror := "Code run obtain folder structure error:" + dberror.Error()
			WSLogError(envID, runid, rerror, models.CodeRun{})
			return models.CodeRun{}, errors.New(rerror)
		}

		// parentfolderdata := envID + "/coderun/" + pipelineID + "/" + nodeID
		var err error

		// 	// The folder structure will look like <environment ID>/coderun/<pipeline ID>/<node ID>

		// filesdata, parentfolderdata, filesdata.FolderID,

		commands = append(commands, "python3 -u ${{nodedirectory}}"+filesdata.FileName)
		runSend, err = RunCodeServerWorker(envID, pipelineID, nodeID, workerGroup, runid, commands, replayRunID)
		if err != nil {
			/* Send back any local errors not happening on the remote worker */
			WSLogError(envID, runid, err.Error(), models.CodeRun{})
			return runSend, err
		}

		/* ------------------------- RPA Python node -------------------- */
	case "rpa-python":

		// ------ Obtain folder structure from file id
		filesdata := models.CodeFiles{}
		dberror := database.DBConn.Where("file_id = ? and environment_id =? and level = ?", fileID, envID, "node_file").Find(&filesdata).Error
		if dberror != nil {
			rerror := "Code run obtain folder structure error:" + dberror.Error()
			WSLogError(envID, runid, rerror, models.CodeRun{})
			return models.CodeRun{}, errors.New(rerror)
		}

		parentfolderdata := ""
		var err error
		if filesdata.FolderID != "" {
			parentfolderdata, err = filesystem.NodeLevelFolderConstructByID(database.DBConn, filesdata.FolderID, envID)
			if err != nil {
				return models.CodeRun{}, errors.New("File record not found")
			}
		} else {
			return models.CodeRun{}, errors.New("File record not found")
		}

		log.Println("RPA file:", parentfolderdata, "python3 -u ${{nodedirectory}}"+filesdata.FileName)

		commands = append(commands, "python3 -u ${{nodedirectory}}"+filesdata.FileName)
		runSend, err = RunCodeRPAWorker(pipelineID, envID, nodeID, workerGroup, runid, commands, filesdata, parentfolderdata, filesdata.FolderID)
		if err != nil {
			/* Send back any local errors not happening on the remote worker */
			WSLogError(envID, runid, err.Error(), models.CodeRun{})
			return runSend, err
		}
	default:
		return models.CodeRun{}, errors.New("Code run type not found.")
	}

	//
	return runSend, nil

}
