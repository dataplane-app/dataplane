package database

import (
	"context"
	"log"

	dpconfig "github.com/dataplane-app/dataplane/app/mainapp/config"
	"github.com/go-redis/redis/v8"
)

var RedisConn *redis.Client

func RedisConnect() {

	ctx := context.Background()

	RedisConn = redis.NewClient(&redis.Options{
		Addr:     dpconfig.DPRedisHost + ":" + dpconfig.DPRedisPort,
		Password: dpconfig.DPRedisPassword, // no password set
		DB:       dpconfig.DPRedisDB,       // use default DB
	})

	_, err := RedisConn.Ping(ctx).Result()
	if err != nil {
		log.Panic("Redis connect error:", err)
	}

}
