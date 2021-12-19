package pipelines

import (
	"dataplane/scheduler"
	"log"
	"testing"
)

/*
For individual tests - in separate window run: go run server.go
go test -p 1 -v -count=1 -run TestSchedulerStart dataplane/Tests/users
* Test scheduler
*/
func TestSchedulerStart(tttt *testing.T) {

	err := scheduler.SchedulerStart()
	log.Println(err)

}
