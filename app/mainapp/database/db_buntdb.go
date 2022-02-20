package database

import "github.com/tidwall/buntdb"

var GoDBWorkerGroup *buntdb.DB
var GoDBWorker *buntdb.DB
var GoDBQueue *buntdb.DB
var GoDBNodes *buntdb.DB
var GoDBEdges *buntdb.DB

func GoDBConnect() {
	GoDBWorkerGroup, _ = buntdb.Open(":memory:")

	GoDBWorkerGroup.CreateIndex("environment", "*", buntdb.IndexJSON("Env"))

	GoDBWorker, _ = buntdb.Open(":memory:")

	GoDBWorker.CreateIndex("environment", "*", buntdb.IndexJSON("Env"))
	GoDBWorker.CreateIndex("workergroup", "*", buntdb.IndexJSON("WorkerGroup"))

	GoDBQueue, _ = buntdb.Open(":memory:")
	GoDBQueue.CreateIndex("environment", "*", buntdb.IndexJSON("Env"))

	// GoDBNodes, _ = buntdb.Open(":memory:")
	// GoDBNodes.CreateIndex("env_pipeline", "*", buntdb.IndexJSON("Env"), buntdb.IndexJSON("Pipeline"))

	// GoDBEdges, _ = buntdb.Open(":memory:")
	// GoDBEdges.CreateIndex("from_to", "*", buntdb.IndexJSON("From"), buntdb.IndexJSON("To"))
	// GoDBEdges.CreateIndex("env_pipeline", "*", buntdb.IndexJSON("Env"), buntdb.IndexJSON("Pipeline"))

}
