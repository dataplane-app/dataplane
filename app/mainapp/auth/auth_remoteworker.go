package auth

import (
	"context"
	"log"
	"time"

	"github.com/dataplane-app/dataplane/app/mainapp/database"
	"github.com/google/uuid"
)

func AuthRemoteWorker(remoteWorkerID string, secretToken string) (string, error) {

	ctx := context.Background()

	var sessionID string

	// log.Println("Remote worker:", request, remoteWorkerID, sessionID)

	// 0. Authenticate the worker

	// 1. is the worker allowed (not on deny list) / activated (activated on database)?
	// To deny the session, simply remove session of the worker ID after clicking deactivate in UI

	// 2. Store redis session for the worker - keep alive for 1 week
	sessionID = uuid.NewString()
	log.Println(sessionID)
	_, err := database.RedisConn.Set(ctx, "sess-"+remoteWorkerID, sessionID, 7*24*time.Hour).Result()
	if err != nil {
		log.Println("Remote worker redis set connect error:", err)
		return "", err
	}

	return sessionID, nil

}
