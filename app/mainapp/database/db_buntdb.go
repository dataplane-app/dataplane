package database

import "github.com/tidwall/buntdb"

var GoDBWorkerGroup *buntdb.DB
var GoDBWorker *buntdb.DB
var GoDBQueue *buntdb.DB

func GoDBConnect() {
	GoDBWorkerGroup, _ = buntdb.Open(":memory:")

	GoDBWorkerGroup.CreateIndex("environment", "*", buntdb.IndexJSON("Env"))

	GoDBWorker, _ = buntdb.Open(":memory:")

	GoDBWorker.CreateIndex("environment", "*", buntdb.IndexJSON("Env"))
	GoDBWorker.CreateIndex("workergroup", "*", buntdb.IndexJSON("WorkerGroup"))

	GoDBQueue, _ = buntdb.Open(":memory:")
	GoDBQueue.CreateIndex("environment", "*", buntdb.IndexJSON("Env"))
}
