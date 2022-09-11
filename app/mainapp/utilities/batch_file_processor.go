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
	"io/ioutil"
	"log"
	"math"
	"os"
	"time"

	"github.com/golang-queue/contrib/zerolog"
	"github.com/golang-queue/queue"
)

type FileContent struct {
	URL      string `json:"url"`
	FileName string `json:"fileName"`
	Size     int64  `json:"size"`
	MimeType string `json:"mimeType"`
	Content  []byte `json:"content"`
}

/*
Run Super secret squirrel function test
go test -timeout 30s -count=1 -v -run ^TestBatchProcess$ dataplane/mainapp/utilities
*/
func bgwriter(textback chan string) {
	for {
		select {
		case printme := <-textback:
			log.Println(printme)
		}
	}
}

var textback = make(chan string)
var errback = make(chan string)

func BatchFileWrite(poolsize int, maxBatchSize int, items []FileContent, folderLocation string) {

	// ---- Workers
	// initial queue pool

	q := queue.NewPool(poolsize, queue.WithLogger(zerolog.New()))
	// shutdown the service and notify all the worker
	// wait all jobs are complete.
	defer q.Release()

	if maxBatchSize == 0 {
		maxBatchSize = 1000
	}

	skip := 0
	filesAmount := len(items)
	batchCount := int(math.Ceil(float64(filesAmount / maxBatchSize)))
	log.Println("Batch count (rounds):", batchCount, "Count:", filesAmount, "Batch size:", maxBatchSize, "pool size:", poolsize)

	// go bgwriter(textback)
	starttop := time.Now()

	// Totalcount := 0

	// Go through the batches
	for i := 1; i <= batchCount; i++ {
		lowerBound := skip
		upperBound := skip + maxBatchSize

		if upperBound > filesAmount {
			upperBound = filesAmount
		}

		// slice
		batchItems := items[lowerBound:upperBound]

		// log.Println("====== batch: ", i)
		// log.Println("Batches:", batchItems)

		go func(i int) {
			if err := q.QueueTask(func(ctx context.Context) error {

				// t := 0
				start := time.Now()
				// Write out each file
				for _, meta := range batchItems {

					if _, err := os.Stat(folderLocation); os.IsNotExist(err) {
						os.MkdirAll(folderLocation, 0700) // Create your file
					}

					err := ioutil.WriteFile(folderLocation+meta.FileName, meta.Content, 0644)
					if err != nil {
						errback <- err.Error()
					}
					// Totalcount = Totalcount + 1
					// t = n
				}

				// Last batch
				elapsed := time.Since(start)
				textback <- fmt.Sprintf("Records written: %v | %s | batch: %v | %s", maxBatchSize, elapsed, i, time.Now())

				// if batchCount == i {
				// 	elapsed := time.Since(start)
				// 	// log.Printf("Write took %s", elapsed)
				// 	textback <- fmt.Sprintf("Batch size: %v with %v workers @ records %v = %s | last batch: %v", maxBatchSize, poolsize, filesAmount, elapsed, i)
				// }
				//

				// rets <- fmt.Sprintf("Hi Gopher, handle the job: %02d", +i)
				// blocks until all sent
				// textback <- fmt.Sprintf("last batch: %v ", i)
				return nil
			}); err != nil {
				log.Println(err)
			}
		}(i)

		skip += maxBatchSize
	}

	// for i := 0; i <= batchCount; i++ {
	// 	select {
	// 	case printme := <-textback:
	// 		log.Println(printme)
	// 		// default:
	// 		// fmt.Println("Nothing available")
	// 	}

	// }
	for i := 1; i <= batchCount; i++ {
		fmt.Println("", <-textback)
	}
	log.Println(fmt.Sprintf("Workers: %v | Total records: %v | Batch size: %v | Completed time: %s", poolsize, filesAmount, maxBatchSize, time.Since(starttop)))
	// wait until all tasks done
	// for i := 0; i < batchCount; i++ {
	// 	// if batchCount
	// 	fmt.Println("message:", <-textback)
	// 	// fmt.Println("error:", <-errback)
	// 	time.Sleep(20 * time.Millisecond)
	// }

	// time.Sleep(5)

	// assert.Equalf(t, filesAmount, Totalcount, "Batch processing.")
}
