package tests

import (
	tests "dataplane/Tests"
	"log"
	"testing"
)

/*
go test -p 1 -v -count=1 -run TestAvailablePermissions dataplane/Tests/permissions
*/
func TestAvailablePermissions(t *testing.T) {

	log.Println(tests.DbInstance)

}
