package auth

import (
	"dataplane/logging"
	"os"

	"golang.org/x/crypto/bcrypt"
)

func Encrypt(rawPassword string) (string, error) {
	password := []byte(rawPassword)
	hashedPassword, err := bcrypt.GenerateFromPassword(
		password,
		14, //bcrypt.DefaultCost=10
	)

	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", err

	}

	return string(hashedPassword), nil
}
