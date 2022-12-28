package configascode

import "time"

type PipeineYAML struct {
	Kind          string     `yaml:"kind"`
	Version       string     `yaml:"version"`
	EnvironmentID string     `yaml:"environment_id"`
	PipelineID    string     `yaml:"pipeline_id"`
	PipelineName  string     `yaml:"pipeline_name"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     *time.Time `json:"updated_at"`
}
