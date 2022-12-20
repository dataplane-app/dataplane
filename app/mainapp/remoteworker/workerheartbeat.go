package remoteworker

import (
	"context"
	"errors"
	"log"
	"time"

	"github.com/dataplane-app/dataplane/app/mainapp/database"
	"github.com/go-redis/redis/v8"
)

type RemoteWorker string

type SessionInputs struct {
	RemoteWorkerID string
	SessionID      string
}

func (t *RemoteWorker) HeartBeat(args *SessionInputs, reply string) error {

	ctx := context.Background()

	/* ---- Store the worker with a lease ---- */
	// Store and struct in Redis - https://github.com/go-redis/redis/blob/f8cbf483f4a193d441fac2cf14be3d84783848c6/example_test.go#L281

	if _, err := database.RedisConn.Pipelined(ctx, func(rdb redis.Pipeliner) error {
		rdb.HSet(ctx, "rw-"+args.RemoteWorkerID, "time", time.Now().UTC().Unix())
		rdb.HSet(ctx, "rw-"+args.RemoteWorkerID, "sessionID", args.SessionID)
		rdb.Expire(ctx, "rw-"+args.RemoteWorkerID, 15*time.Second)
		return nil
	}); err != nil {
		log.Println("Failed to set remote worker heartbeat:", err)
		// panic("")
		return errors.New("Failed to set remote worker heartbeat")
	}

	return nil

}
