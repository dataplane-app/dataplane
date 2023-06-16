package remoteworker

import (
	"context"
	"errors"
	"log"

	"github.com/dataplane-app/dataplane/app/mainapp/database"
	"github.com/dataplane-app/dataplane/app/mainapp/database/models"
	"github.com/go-redis/redis/v8"
)

/* looks up remote workers given process group and environment id */
func OnlineRemoteWorkers(envID string, workerGroup string) (string, error) {

	ctx := context.Background()

	/* Look up chosen workers - for this worker group */
	var workers []models.RemoteWorkerEnvironments
	err := database.DBConn.Select("worker_id").Where("environment_id =? and remote_process_group_id = ?", envID, workerGroup).Find(&workers).Error
	if err != nil {
		log.Println("RunCodeRPAWorker Err: ", err)
		return "", errors.New("Code run: Worker groups database error.")
	}

	// log.Println("I got here...")

	var workerslist []string
	var workerscan models.RPAWorkersOnline
	var remoteWorkerID string

	/* Will select the first one in Redis - can be adpated later for load balancing */
	for _, v := range workers {
		workerslist = append(workerslist, "rw-"+v.WorkerID)

		errRedis := database.RedisConn.HGetAll(ctx, "rw-"+v.WorkerID).Scan(&workerscan)
		if errRedis != nil && errRedis != redis.Nil {
			log.Println("Failed to find online workers:", errRedis)
			return "", errors.New("RPA worker error: failed to find online workers")
		}

		/* select the worker id */
		remoteWorkerID = v.WorkerID

		if workerscan.SessionID != "" {
			break
		}

	}

	if workerscan.SessionID == "" {
		return "", errors.New("No RPA workers found online.")
	}

	return remoteWorkerID, nil

}
