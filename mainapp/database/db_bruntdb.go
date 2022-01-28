package database

import "github.com/tidwall/buntdb"

var GoDBWorkerGroup *buntdb.DB
var GoDBWorker *buntdb.DB

func GoDBConnect() {
	GoDBWorkerGroup, _ = buntdb.Open(":memory:")
	GoDBWorker, _ = buntdb.Open(":memory:")
}
