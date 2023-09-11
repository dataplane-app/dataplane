package models

type RedisAPIData struct {
	Data      string `redis:"data"`
	Timestamp int64  `redis:"timestamp"`
}
