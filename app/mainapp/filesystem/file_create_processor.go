package filesystem

import (
	"dataplane/mainapp/config"
	"dataplane/mainapp/database/models"
	"errors"
	"log"
	"os"
)

/* Processor file will be overwritten */
func FileCreateProcessor(nodeTypeDesc string, nodePath string, node models.PipelineNodes) (filepath string, err error) {

	switch nodeTypeDesc {

	// Python processor
	case "python":

		content := `print("Pipeline id: ` + node.PipelineID + `")
print("Node id: ` + node.NodeID + `")
`

		log.Println(content)
		filepath = nodePath + "/dp-entrypoint.py"
		err := os.WriteFile(filepath, []byte(content), 0644)
		if err != nil {
			return filepath, errors.New("Failed to write python file")
		}

	default:
		return "", errors.New("Node type not found")
	}

	if config.Debug == "true" {
		log.Println("Processor file created:", filepath)
	}

	return filepath, nil
}
