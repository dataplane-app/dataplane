package auth

import (
	"log"
	"os"

	"golang.org/x/crypto/bcrypt"
)

func Encrypt(rawPassword string) string {
	password := []byte(rawPassword)
	hashedPassword, err := bcrypt.GenerateFromPassword(
		password,
		bcrypt.DefaultCost,
	)

	if err != nil {
		if os.Getenv("debug") == "true" {
			log.Println(err)
		}

	}

	return string(hashedPassword)
}
