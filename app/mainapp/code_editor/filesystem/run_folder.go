package filesystem

import "path/filepath"

/* Node level Folder structure: */
func PipelineRunFolderNode(codeDirectory string, EnvironmentID string, PipelineID string, NodeID string) string {

	return filepath.Join(codeDirectory, EnvironmentID, "pipeline", PipelineID, NodeID)
}

func CodeRunFolderNode(codeDirectory string, EnvironmentID string, PipelineID string, NodeID string) string {

	return filepath.Join(codeDirectory, EnvironmentID, "coderun", PipelineID, NodeID)
}

func DeployRunFolderNode(codeDirectory string, EnvironmentID string, PipelineID string, Version string, NodeID string) string {

	return filepath.Join(codeDirectory, EnvironmentID, "deployment", PipelineID, Version, NodeID)
}

/* Pipeline level folder structure */
func PipelineRunFolderPipeline(codeDirectory string, EnvironmentID string, PipelineID string) string {

	return filepath.Join(codeDirectory, EnvironmentID, "pipeline", PipelineID)
}

func CodeRunFolderPipeline(codeDirectory string, EnvironmentID string, PipelineID string) string {

	return filepath.Join(codeDirectory, EnvironmentID, "coderun", PipelineID)
}

func DeployRunFolderPipeline(codeDirectory string, EnvironmentID string, PipelineID string, Version string) string {

	return filepath.Join(codeDirectory, EnvironmentID, "deployment", PipelineID, Version)
}
