package models

import "time"

type RWMessage struct {
	Request  string
	Status   string //error or OK
	Response string
}

type RPAWorkersOnline struct {
	Time      int64  `redis:"time"`
	SessionID string `redis:"sessionID"`
}

type RPAWorkerOnlineWS struct {
	Time     time.Time
	Status   string
	WorkerID string
}
