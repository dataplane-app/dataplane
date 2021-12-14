package pipelines

type PipelineYAML struct {
	ApiVersion string `yaml:"apiVersion" json:"apiVersion"`
	Kind       string `yaml:"kind" json:"kind"`
	Metadata   struct {
		Name        string   `yaml:"name" json:"name"`
		Version     string   `yaml:"version" json:"version"`
		Description string   `yaml:"description" json:"description"`
		Tags        []string `yaml:"tags" json:"tags"`
	} `yaml:"metadata" json:"metadata"`
	Spec struct {
		Schedule     string `yaml:"schedule" json:"schedule"`
		ScheduleType string `yaml:"schedule_type" json:"schedule_type"`
	} `yaml:"spec" json:"spec"`
}

// PipelineMetaData
// type PipelineMetaData struct {
// 	Name        string `yaml:"name" json:"name"`
// 	Description string `yaml:"description" json:"description"`
// }

// apiVersion: apps/v1
// kind: Pipeline
// metadata:
//   name: clean-logs
//   description: "A flow to clean out logs"
//   # Version needs to be unique
//   version: v0.0.1
//   tags:
//     - hello
//     - hashtag
// spec:
//   schedule: "*/30 * * * *"
//   schedule_type: "crontab"
