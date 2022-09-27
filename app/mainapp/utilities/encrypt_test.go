package utilities

import (
	"log"
	"testing"

	gonanoid "github.com/matoous/go-nanoid/v2"
	"github.com/stretchr/testify/assert"
)

/*
Run Super secret squirrel function test
go test -timeout 30s -v -run ^TestEncryptFunction$ dataplane/utilities
*/
func TestEncryptFunction(t *testing.T) {

	Encryptphrase, _ = gonanoid.Generate("1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ", 32)

	secretmessage := "Secret squirrel."

	encrypted, _ := Encrypt(secretmessage)

	log.Println("Encrypted: ", encrypted)

	decrypted, _ := Decrypt(encrypted)

	log.Println("Decrypted: ", decrypted)

	assert.Equalf(t, secretmessage, decrypted, "Encryption.")

}
