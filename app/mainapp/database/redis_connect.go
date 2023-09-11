package database

import (
	"context"
	"log"
	"os"
	"strconv"

	"github.com/go-redis/redis/v8"
)

var RedisConn *redis.Client

func RedisConnect() {

	ctx := context.Background()

	// // Redis connection
	// DPRedisHost = os.Getenv("DP_REDIS_HOST")
	// DPRedisPort = os.Getenv("DP_REDIS_PORT")
	DPRedisDB, _ := strconv.Atoi(os.Getenv("DP_REDIS_DB"))
	if DPRedisDB == 0 {
		DPRedisDB = 1
	}
	// DPRedisPassword = os.Getenv("DP_REDIS_PASSWORD")

	RedisConn = redis.NewClient(&redis.Options{
		Addr:     os.Getenv("DP_REDIS_HOST") + ":" + os.Getenv("DP_REDIS_PORT"),
		Password: os.Getenv("DP_REDIS_PASSWORD"),
		DB:       DPRedisDB, // use default DB
	})

	_, err := RedisConn.Ping(ctx).Result()
	if err != nil {
		log.Panic("Redis connect error:", err)
	}

}
