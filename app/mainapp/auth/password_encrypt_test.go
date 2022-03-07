package auth

import (
	"testing"

	"golang.org/x/crypto/bcrypt"
)

/*
Testing password encrypt function
go test -timeout 30s -v -run ^TestPasswordEncrypt$ dataplane/auth
*/
func TestPasswordEncrypt(t *testing.T) {
	hash, _ := Encrypt("Apple")
	if err := bcrypt.CompareHashAndPassword([]byte(hash), []byte("Apple")); err != nil {
		t.Error("Password function failed.")
	}
}
