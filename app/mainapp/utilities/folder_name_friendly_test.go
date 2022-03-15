package utilities

import (
	"log"
	"testing"

	"github.com/stretchr/testify/assert"
)

/*
Run Super secret squirrel function test
go test -timeout 30s -v -run ^TestFolderFriendly$ dataplane/utilities
*/
func TestFolderFriendly(t *testing.T) {

	message := "Hi there, I am a_Folder!$%^-"

	output := FolderFriendly(message)

	log.Println("Converted: ", output)

	assert.Equalf(t, "Hi_there_I_am_a_Folder", output, "Folder friendly.")

}
