package models

type LeaderElection struct {
	NodeID    string `redis:"nodeid"`
	Timestamp int64  `redis:"timestamp"`
}
