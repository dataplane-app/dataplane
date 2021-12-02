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
		bcrypt.DefaultCost,
	)

	if err != nil {
		if os.Getenv("debug") == "true" {
			logging.PrintSecretsRedact(err)
		}
		return "", err

	}

	return string(hashedPassword), nil
}
