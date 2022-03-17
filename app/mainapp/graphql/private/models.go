// Code generated by github.com/99designs/gqlgen, DO NOT EDIT.

package privategraphql

import (
	"dataplane/mainapp/database/models"
	"time"
)

type AccessGroupsInput struct {
	AccessGroupID string `json:"AccessGroupID"`
	Name          string `json:"Name"`
	Description   string `json:"Description"`
	Active        bool   `json:"Active"`
	EnvironmentID string `json:"EnvironmentID"`
}

type AddEnvironmentInput struct {
	Name        string  `json:"name"`
	Description *string `json:"description"`
}

type AddPreferencesInput struct {
	Preference string `json:"preference"`
	Value      string `json:"value"`
}

type AddSecretsInput struct {
	Secret        string  `json:"Secret"`
	Description   *string `json:"Description"`
	Value         string  `json:"Value"`
	EnvironmentID string  `json:"EnvironmentId"`
	Active        bool    `json:"Active"`
}

type AddUpdateMeInput struct {
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Email     string `json:"email"`
	JobTitle  string `json:"job_title"`
	Timezone  string `json:"timezone"`
}

type AddUsersInput struct {
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Email     string `json:"email"`
	JobTitle  string `json:"job_title"`
	Password  string `json:"password"`
	Timezone  string `json:"timezone"`
}

type ChangePasswordInput struct {
	Password string `json:"password"`
	UserID   string `json:"user_id"`
}

type DataInput struct {
	Language    string      `json:"language"`
	Genericdata interface{} `json:"genericdata"`
}

type FilesNodeInput struct {
	FolderID      string `json:"folderID"`
	ParentID      string `json:"parentID"`
	EnvironmentID string `json:"environmentID"`
	PipelineID    string `json:"pipelineID"`
	NodeID        string `json:"nodeID"`
	FolderName    string `json:"folderName"`
	Level         string `json:"level"`
	FType         string `json:"fType"`
	Active        bool   `json:"active"`
}

type PipelineEdgesInput struct {
	EdgeID string                  `json:"edgeID"`
	From   string                  `json:"from"`
	To     string                  `json:"to"`
	Meta   *PipelineEdgesMetaInput `json:"meta"`
	Active bool                    `json:"active"`
}

type PipelineEdgesMetaInput struct {
	SourceHandle  string `json:"sourceHandle"`
	TargetHandle  string `json:"targetHandle"`
	EdgeType      string `json:"edgeType"`
	ArrowHeadType string `json:"arrowHeadType"`
}

type PipelineFlow struct {
	Edges []*models.PipelineEdges `json:"edges"`
	Nodes []*models.PipelineNodes `json:"nodes"`
}

type PipelineFlowInput struct {
	NodesInput []*PipelineNodesInput `json:"nodesInput"`
	EdgesInput []*PipelineEdgesInput `json:"edgesInput"`
	JSON       interface{}           `json:"json"`
}

type PipelineNodesInput struct {
	NodeID        string                  `json:"nodeID"`
	Name          string                  `json:"name"`
	NodeType      string                  `json:"nodeType"`
	NodeTypeDesc  string                  `json:"nodeTypeDesc"`
	TriggerOnline bool                    `json:"triggerOnline"`
	Description   string                  `json:"description"`
	Commands      interface{}             `json:"commands"`
	Meta          *PipelineNodesMetaInput `json:"meta"`
	WorkerGroup   string                  `json:"workerGroup"`
	Active        bool                    `json:"active"`
}

type PipelineNodesMetaInput struct {
	Position *PositionInput `json:"position"`
	Data     *DataInput     `json:"data"`
}

type PipelinePermissionsOutput struct {
	Access        string `json:"Access"`
	Subject       string `json:"Subject"`
	SubjectID     string `json:"SubjectID"`
	PipelineName  string `json:"PipelineName"`
	ResourceID    string `json:"ResourceID"`
	EnvironmentID string `json:"EnvironmentID"`
	Active        bool   `json:"Active"`
	Level         string `json:"Level"`
	Label         string `json:"Label"`
	FirstName     string `json:"FirstName"`
	LastName      string `json:"LastName"`
	Email         string `json:"Email"`
	JobTitle      string `json:"JobTitle"`
}

type Pipelines struct {
	PipelineID    string    `json:"pipelineID"`
	Name          string    `json:"name"`
	EnvironmentID string    `json:"environmentID"`
	Description   string    `json:"description"`
	Active        bool      `json:"active"`
	Online        bool      `json:"online"`
	Current       string    `json:"current"`
	WorkerGroup   string    `json:"workerGroup"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
	NodeType      string    `json:"node_type"`
	NodeTypeDesc  string    `json:"node_type_desc"`
	Schedule      string    `json:"schedule"`
	ScheduleType  string    `json:"schedule_type"`
}

type Platform struct {
	ID           string `json:"id"`
	BusinessName string `json:"business_name"`
	Timezone     string `json:"timezone"`
	Complete     bool   `json:"complete"`
}

type PositionInput struct {
	X int `json:"x"`
	Y int `json:"y"`
}

type Preferences struct {
	Preference string `json:"preference"`
	Value      string `json:"value"`
}

type UpdateEnvironment struct {
	ID          string  `json:"id"`
	Name        string  `json:"name"`
	Description *string `json:"description"`
}

type UpdateSecretsInput struct {
	Secret        string  `json:"Secret"`
	Description   *string `json:"Description"`
	EnvironmentID string  `json:"EnvironmentId"`
	Active        bool    `json:"Active"`
}

type UpdateUsersInput struct {
	UserID    string `json:"user_id"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Email     string `json:"email"`
	JobTitle  string `json:"job_title"`
	Timezone  string `json:"timezone"`
}

type WorkerGroup struct {
	WorkerGroup string    `json:"WorkerGroup"`
	Status      string    `json:"Status"`
	T           time.Time `json:"T"`
	Interval    int       `json:"Interval"`
	Env         string    `json:"Env"`
	Lb          string    `json:"LB"`
	WorkerType  string    `json:"WorkerType"`
}

type WorkerTasks struct {
	TaskID        string     `json:"task_id"`
	EnvironmentID string     `json:"environment_id"`
	RunID         string     `json:"run_id"`
	WorkerGroup   string     `json:"worker_group"`
	WorkerID      string     `json:"worker_id"`
	PipelineID    string     `json:"pipeline_id"`
	NodeID        string     `json:"node_id"`
	StartDt       *time.Time `json:"start_dt"`
	EndDt         *time.Time `json:"end_dt"`
	Status        string     `json:"status"`
	Reason        string     `json:"reason"`
}

type Workers struct {
	WorkerGroup string    `json:"WorkerGroup"`
	WorkerID    string    `json:"WorkerID"`
	Status      string    `json:"Status"`
	T           time.Time `json:"T"`
	Interval    int       `json:"Interval"`
	CPUPerc     float64   `json:"CPUPerc"`
	Load        float64   `json:"Load"`
	MemoryPerc  float64   `json:"MemoryPerc"`
	MemoryUsed  float64   `json:"MemoryUsed"`
	Env         string    `json:"Env"`
	EnvID       string    `json:"EnvID"`
	Lb          string    `json:"LB"`
	WorkerType  string    `json:"WorkerType"`
}

type UpdatePlatformInput struct {
	ID           string `json:"id"`
	BusinessName string `json:"business_name"`
	Timezone     string `json:"timezone"`
	Complete     bool   `json:"complete"`
}
