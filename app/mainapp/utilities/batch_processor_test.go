package utilities

// This is the max. number of items each batch will contain
// const maxBatchSize int = 25

// // `skip` will be our cursor to remember how
// // many items we already processed before
// skip := 0

// // `batchAmount` is the important metric, it will contain
// // the exact number of batches needed to process all items
// // depending on the maxBatchSize, where the last batch
// // may contain less than 25 (maxBatchSize) elements
// filesAmount := len(items)
// batchAmount := int(math.Ceil(float64(filesAmount / maxBatchSize)))

import (
	"context"
	"fmt"
	"log"
	"math"
	"testing"

	"github.com/golang-queue/queue"
)

type FileItem struct {
	URL      string `json:"url"`
	FileName string `json:"fileName"`
	Size     int64  `json:"size"`
	MimeType string `json:"mimeType"`
}

/*
Run Super secret squirrel function test
go test -timeout 30s -count=1 -v -run ^TestBatchProcess$ dataplane/mainapp/utilities
*/
func backgroundwriter(textback chan string) {
	for {
		select {
		case printme := <-textback:
			log.Println(printme)
		}
	}
}
func TestBatchProcess(t *testing.T) {

	// ---- Workers
	// initial queue pool
	q := queue.NewPool(10)
	// shutdown the service and notify all the worker
	// wait all jobs are complete.
	defer q.Release()

	items := make([]FileItem, 1000000)

	const maxBatchSize int = 10000
	skip := 0
	filesAmount := len(items)
	batchAmount := int(math.Ceil(float64(filesAmount / maxBatchSize)))
	log.Println("Rounds:", batchAmount, "Count:", filesAmount, "Batch size:", maxBatchSize)
	var textback = make(chan string)

	// go backgroundwriter(textback)

	Totalcount := 0
	for i := 0; i <= batchAmount; i++ {
		lowerBound := skip
		upperBound := skip + maxBatchSize

		if upperBound > filesAmount {
			upperBound = filesAmount
		}

		// slice
		batchItems := items[lowerBound:upperBound]
		// log.Println("Batches:", batchItems)

		go func(i int) {
			if err := q.QueueTask(func(ctx context.Context) error {

				log.Println("====== batch: ", i)
				t := 0
				for n, _ := range batchItems {
					Totalcount = Totalcount + 1
					t = n
				}

				textback <- fmt.Sprintf("batch: %v | no. in batch: %v | Accumulate count: %v", i, t, Totalcount)

				// rets <- fmt.Sprintf("Hi Gopher, handle the job: %02d", +i)
				return nil
			}); err != nil {
				log.Println(err)
			}
		}(i)

		skip += maxBatchSize
	}

	for i := 0; i <= batchAmount; i++ {
		select {
		case printme := <-textback:
			log.Println(printme)
		}
	}

	// time.Sleep(5)

	// assert.Equalf(t, filesAmount, Totalcount, "Batch processing.")
}
