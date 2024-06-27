package authoidc

import (
	"errors"
	"strings"

	"github.com/dataplane-app/dataplane/app/mainapp/auth"
	"github.com/dataplane-app/dataplane/app/mainapp/database"
	"github.com/dataplane-app/dataplane/app/mainapp/database/models"
	"github.com/dataplane-app/dataplane/app/mainapp/logging"
	"github.com/dataplane-app/dataplane/app/mainapp/utilities"
	"github.com/google/uuid"
)

// OIDCCreateUser creates a new user in the database if auto register is true
func OIDCCreateUser(userData models.Users) (models.Users, error) {

	// Hash generated password
	password, perror := utilities.GenerateRandomString(16)
	if perror != nil {
		return userData, perror
	}

	var err error
	userData.Password, err = auth.Encrypt(password)

	if err != nil {
		return userData, errors.New("Password hash failed.")
	}

	userData.UserID = uuid.New().String()
	userData.Status = "active"
	userData.Active = true
	userData.JobTitle = " "

	// If no timezone provided use the org timezone
	u := models.Platform{}
	database.DBConn.First(&u)
	userData.Timezone = u.Timezone

	// Create the user
	errdb := database.DBConn.Create(&userData).Error

	if errdb != nil {

		logging.PrintSecretsRedact(err)
		if strings.Contains(err.Error(), "duplicate key") {
			return userData, errors.New("User already exists.")
		}
		return userData, errors.New("OIDC create user database error.")
	}

	return userData, nil

}

// userData := models.Users{
// 	UserID:    uuid.New().String(),
// 	FirstName: input.FirstName,
// 	LastName:  input.LastName,
// 	Password:  password,
// 	Email:     input.Email,
// 	Status:    "active",
// 	Active:    true,
// 	JobTitle:  input.JobTitle,
// 	Timezone:  input.Timezone,
// 	Username:  input.Email,
// }
