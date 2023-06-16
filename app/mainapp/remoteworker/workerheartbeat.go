package remoteworker

import (
	"context"
	"errors"
	"log"
	"time"

	"github.com/dataplane-app/dataplane/app/mainapp/database"
	"github.com/go-redis/redis/v8"
	"github.com/gofiber/websocket/v2"
)

func RWHeartBeat(conn *websocket.Conn, requestID string, RemoteWorkerID string, SessionID string) (string, error) {

	ctx := context.Background()

	/* ---- Store the worker with a lease ---- */
	// Store and struct in Redis - https://github.com/go-redis/redis/blob/f8cbf483f4a193d441fac2cf14be3d84783848c6/example_test.go#L281

	if _, err := database.RedisConn.Pipelined(ctx, func(rdb redis.Pipeliner) error {
		rdb.HSet(ctx, "rw-"+RemoteWorkerID, "time", time.Now().UTC().Unix())
		rdb.HSet(ctx, "rw-"+RemoteWorkerID, "sessionID", SessionID)
		rdb.Expire(ctx, "rw-"+RemoteWorkerID, 30*time.Second)
		return nil
	}); err != nil {
		log.Println("Failed to set remote worker heartbeat:", err)
		return "", errors.New("Failed to set remote worker heartbeat")
	}

	return RemoteWorkerID, nil

}
