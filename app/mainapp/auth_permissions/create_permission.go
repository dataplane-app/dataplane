package permissions

import (
	"dataplane/mainapp/database"
	"dataplane/mainapp/database/models"
	"errors"

	"github.com/google/uuid"
)

func CreatePermission(
	subject string,
	subjectID string,
	resource string,
	resourceID string,
	access string,
	environment string,
	platformAdmin bool,
) (models.Permissions, error) {

	var response = models.Permissions{}

	// checks - subject, resources, access
	subjectTypecheck := false
	resourceTypecheck := false
	accessTypecheck := false
	for _, b := range models.SubjectType {
		if b == subject {
			subjectTypecheck = true
		}

	}

	for _, b := range models.ResourceType {
		if b.Code == resource {
			resourceTypecheck = true
		}

	}

	for _, b := range models.AccessTypes {
		if b == access {
			accessTypecheck = true
		}

	}

	if subjectTypecheck != true {
		return response, errors.New("Permission subject type check failed")
	}

	if resourceTypecheck != true {
		return response, errors.New("Permission resource type check failed")
	}

	if accessTypecheck != true {
		return response, errors.New("Permission access type check failed")
	}

	/*
		am I allowed to create this permission?
		On first sign up, platform admin needs to be set
	*/
	if platformAdmin != true {

	}

	// map data
	response = models.Permissions{
		ID:            uuid.NewString(),
		Subject:       subject,
		SubjectID:     subjectID,
		Resource:      resource,
		ResourceID:    resourceID,
		Access:        access,
		EnvironmentID: environment,
		Active:        true,
	}

	// create permisssion
	err := database.DBConn.Create(&response).Error
	if err != nil {
		return models.Permissions{}, errors.New("Permissions - database create error")
	}
	return response, nil
}
