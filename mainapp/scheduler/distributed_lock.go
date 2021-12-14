import (
	"context"
	"fmt"
	"time"

	"github.com/go-redis/redis/v8"
)

type DistributedLock interface {
	Lock(ctx context.Context, lockName string, maxLockingDuration time.Duration) bool
	UnLock(ctx context.Context, lockName string)
}

func NewDistributedLock(rdb *redis.Client) DistributedLock {
	return &distributedLock{
		rdb: rdb,
	}
}

type distributedLock struct {
	rdb *redis.Client
}

// Lock return TRUE when successfully locked, return FALSE if it's already been locked by others
func (d distributedLock) Lock(ctx context.Context, lockName string, maxLockingDuration time.Duration) bool {
	key := fmt.Sprintf("lock_%s", lockName)
	//check if it's already locked
	iter := d.rdb.Scan(ctx, 0, key, 0).Iterator()
	for iter.Next(ctx) {
		//exit if lock exist
		return false
	}
	//then lock it then
	d.rdb.Set(ctx, key, []byte("true"), maxLockingDuration)
	return true
}

func (d distributedLock) UnLock(ctx context.Context, lockName string) {
	key := fmt.Sprintf("lock_%s", lockName)
	//remove the lock
	d.rdb.Del(ctx, key)
}