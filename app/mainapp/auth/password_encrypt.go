package auth

import (
	"dataplane/mainapp/config"
	"dataplane/mainapp/logging"

	"golang.org/x/crypto/bcrypt"
)

func Encrypt(rawPassword string) (string, error) {
	password := []byte(rawPassword)
	hashedPassword, err := bcrypt.GenerateFromPassword(
		password,
		bcrypt.DefaultCost,
	)

	if err != nil {
		if config.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", err

	}

	return string(hashedPassword), nil
}
