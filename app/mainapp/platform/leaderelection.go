package platform

import (
	"context"
	"log"
	"time"

	dpconfig "github.com/dataplane-app/dataplane/app/mainapp/config"
	"github.com/dataplane-app/dataplane/app/mainapp/database"
	"github.com/dataplane-app/dataplane/app/mainapp/database/models"
	"github.com/dataplane-app/dataplane/app/mainapp/scheduler"
	"github.com/go-redis/redis/v8"

	"github.com/go-co-op/gocron"
)

func PlatformLeaderElectionScheduler(s *gocron.Scheduler, mainAppID string) {

	ctx := context.Background()

	s.Every(1000).Milliseconds().Do(func() {

		redisModel := models.LeaderElection{}
		leaderID := ""

		// log.Println("Leader ID:", dpconfig.Leader)
		// https://github.com/bsm/redislock - considered but same
		// Is there a leader?
		if err := database.RedisConn.HGetAll(ctx, "leader").Scan(&redisModel); err != nil {
			log.Println("Redis get leader error:", err)
		}

		/*
			If leader is nil set the leader with a 10 second lease.
		*/
		if redisModel.NodeID == "" {

			if dpconfig.SchedulerDebug == "true" {
				log.Println("Scheduler: Elect leader.")
			}

			if _, err := database.RedisConn.Pipelined(ctx, func(rdb redis.Pipeliner) error {
				rdb.HSet(ctx, "leader", "nodeid", mainAppID)
				rdb.HSet(ctx, "leader", "timestamp", time.Now().UTC().Unix())
				rdb.Expire(ctx, "leader", 10*time.Second)
				leaderID = mainAppID
				return nil
			}); err != nil {
				log.Println("Failed to elect leader for scheduler: ", err)
				// panic("")
			}

			/*
				After leader election load the schedules
			*/
			scheduler.LoadPipelineSchedules()
			if dpconfig.Debug == "true" || dpconfig.SchedulerDebug == "true" {
				log.Println("Schedules loaded.")
			}

		} else {
			leaderID = redisModel.NodeID

			/*
				If this node is the leader extend the lease on key leader
			*/
			if leaderID == mainAppID {

				if _, err := database.RedisConn.Pipelined(ctx, func(rdb redis.Pipeliner) error {
					rdb.Expire(ctx, "leader", 10*time.Second)
					rdb.HSet(ctx, "leader", "timestamp", time.Now().UTC().Unix())
					return nil
				}); err != nil {
					log.Println("Failed to extend lease on leader election: ", err)
					// panic("")
				}
			}
		}

		/* Testing Leader election logs */

		// tm := time.Unix(redisModel.Timestamp, 0)
		// log.Println("Leader: ", redisModel.NodeID, tm, leaderID == mainAppID)
		// for i, v := range dpconfig.PipelineScheduler.Keys() {

		// if tmp, ok := dpconfig.PipelineScheduler.Get(v); ok {

		// PipelineScheduler := tmp.(*gocron.Scheduler)
		// log.Println("Scheduler:", i, v, PipelineScheduler.IsRunning(), PipelineScheduler.Len())
		// }
		// }

		/*
			Record the change in elected leader
		*/
		if dpconfig.Leader != leaderID {
			if dpconfig.SchedulerDebug == "true" {
				log.Println("Changed elected leader: ", dpconfig.Leader, "->", leaderID)
			}

			/*
				If I am no longer the leader, give up the schedules
			*/
			if mainAppID != leaderID {
				scheduler.RemovePipelineSchedules()
			}

			dpconfig.Leader = leaderID
		}

	})
}
