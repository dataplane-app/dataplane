package utilities

import (
	"log"
	"testing"

	"github.com/stretchr/testify/assert"
)

/*
Run Super secret squirrel function test
go test -timeout 30s -v -run ^TestEncryptFunction$ dataplane/utilities
*/
func TestEncryptFunction(t *testing.T) {

	secretmessage := "Secret squirrel."

	encrypted, _ := Encrypt(secretmessage)

	log.Println("Encrypted: ", encrypted)

	decrypted, _ := Decrypt(encrypted)

	log.Println("Decrypted: ", decrypted)

	assert.Equalf(t, secretmessage, decrypted, "Encryption.")

}
