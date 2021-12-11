package permissiontests

import (
	"dataplane/Tests/testutils"
	"log"
	"testing"
)

/*
go test -p 1 -v -count=1 -run TestAvailablePermissions dataplane/Tests/permissions
*/
func TestAvailablePermissions(t *testing.T) {

	log.Println(testutils.DbInstance)

}
