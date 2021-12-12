package permissions

type Checkstruct struct {
	Access        string `json:"access"`
	Subject       string `json:"subject"`
	SubjectID     string `json:"subject_id"`
	EnvironmentID string `json:"environment_id"`
	Resource      string `json:"resource"`
	ResourceID    string `json:"resource_id"`
}

type CheckResult struct {
	Subject    string      `json:"subject"`
	Count      int64       `json:"count"`
	Perm       Checkstruct `json:"perm"`
	Perm_error error       `json:"perm_error"`
	Result     string      `json:"result"`
}
