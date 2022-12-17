package auth

import (
	"context"
	"errors"
	"log"
	"time"

	"github.com/dataplane-app/dataplane/app/mainapp/database"
	"github.com/dataplane-app/dataplane/app/mainapp/database/models"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func AuthRemoteWorker(remoteWorkerID string, secretToken string) (string, error) {

	ctx := context.Background()

	var sessionID string

	// 1. is the worker allowed (not on deny list) / activated (activated on database)?
	// To deny the session, simply remove session of the worker ID after clicking deactivate in UI

	// 0. Authenticate the worker
	keys := []models.RemoteWorkerActivationKeys{}
	errdb := database.DBConn.Debug().Select("remote_worker_activation_keys.activation_key").
		Where("remote_worker_activation_keys.remote_worker_id=? and (remote_worker_activation_keys.expires_at > now() or remote_worker_activation_keys.expires_at is NULL)", remoteWorkerID).
		Joins("inner join remote_workers rw on rw.worker_id = remote_worker_activation_keys.remote_worker_id and rw.active=true").
		Find(&keys).Error

	if errdb != nil && errdb != gorm.ErrRecordNotFound {
		return "", errdb
	}

	// If no keys are found
	if len(keys) == 0 {
		return "", errors.New("Remote worker deactivated or activation key not found")
	}

	for i, v := range keys {
		if err := bcrypt.CompareHashAndPassword([]byte(v.ActivationKey), []byte(secretToken)); err != nil {

			// Check if the last hash, if not, ignore the error and continue to check the next in line for a match
			if i < len(keys)-1 {
				continue
			}

			return "", errors.New("Remote worker authentication failed")
		}

		// Break out of loop when a match is found
		break
	}

	// 2. Store redis session for the worker - keep alive for 1 week
	sessionID = uuid.NewString()
	// log.Println(sessionID)
	_, err := database.RedisConn.Set(ctx, "sess-"+remoteWorkerID, sessionID, 7*24*time.Hour).Result()
	if err != nil {
		log.Println("Remote worker redis set connect error:", err)
		return "", err
	}

	return sessionID, nil

}
