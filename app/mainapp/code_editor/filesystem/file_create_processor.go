package filesystem

import (
	"dataplane/mainapp/config"
	"dataplane/mainapp/database/models"
	"errors"
	"log"
)

/* Processor file will be overwritten */
func FileCreateProcessor(nodeTypeDesc string, Folder string, FolderID string, node models.PipelineNodes) (filepath string, err error) {

	switch nodeTypeDesc {

	// Python processor
	case "python":

		content := `print("Pipeline id: ` + node.PipelineID + `")
print("Node id: ` + node.NodeID + `")`

		input := models.CodeFiles{
			EnvironmentID: node.EnvironmentID,
			NodeID:        node.NodeID,
			PipelineID:    node.PipelineID,
			FileName:      "dp-entrypoint.py",
			Active:        true,
			Level:         "node_file",
			FType:         "file",
			FolderID:      FolderID,
		}

		// Folder excludes code directory

		_, filepath, err = CreateFile(input, Folder, []byte(content))
		if err != nil {
			return "", err
		}

	default:
		return "", errors.New("Node type not found")
	}

	if dpconfig.Debug == "true" {
		log.Println("Processor file created:", filepath)
	}

	return filepath, nil
}
