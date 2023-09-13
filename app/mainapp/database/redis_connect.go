package database

import (
	"context"
	"errors"
	"log"
	"os"
	"strconv"
	"time"

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

	const maxRetiresAllowed int = 50000

	var errfinal error = errors.New("Redis connection error")
	var err error

	for i := 0; i < maxRetiresAllowed; i++ {

		RedisConn = redis.NewClient(&redis.Options{
			Addr:        os.Getenv("DP_REDIS_HOST") + ":" + os.Getenv("DP_REDIS_PORT"),
			Password:    os.Getenv("DP_REDIS_PASSWORD"),
			DB:          DPRedisDB, // use default DB
			DialTimeout: 60 * time.Second,
		})

		_, err = RedisConn.Ping(ctx).Result()
		if err != nil {
			log.Printf("😩 Redis: connection failure: %v, try number. %d, retry in 5 seconds", err.Error(), i+1)
			time.Sleep(time.Second * 5)
		} else {
			errfinal = nil
			break
		}
	}

	if errfinal != nil {
		log.Panic("😩 Redis: connection failure: ", err.Error())
	}

}
