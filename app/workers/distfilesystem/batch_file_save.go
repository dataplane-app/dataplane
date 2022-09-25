package distfilesystem

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
	"errors"
	"fmt"
	"io/ioutil"
	"log"
	"math"
	"os"
	"time"

	"github.com/dataplane-app/dataplane/app/mainapp/code_editor/filesystem"
	"github.com/dataplane-app/dataplane/app/mainapp/database/models"
	"github.com/dataplane-app/dataplane/app/mainapp/utilities"

	wrkerconfig "github.com/dataplane-app/dataplane/app/workers/config"
	"github.com/dataplane-app/dataplane/app/workers/database"

	"github.com/golang-queue/contrib/zerolog"
	"github.com/golang-queue/queue"
)

/*
Run Super secret squirrel function test
go test -timeout 30s -count=1 -v -run ^TestBatchProcess$ github.com/dataplane-app/dataplane/app/mainapp/utilities
*/
type msgback struct {
	Msg string
	Err error
}

// var errback = make(chan string)

func BatchFileWrite(items []*models.CodeFilesCacheOutput, folderID string, environmentID string, folder string) {

	var textback = make(chan msgback)

	recordCount := len(items)
	// ---- Workers
	maxBatchSize := 1
	switch lookup := recordCount; { // missing expression means "true"
	case lookup < 100:
		maxBatchSize = 5
	case lookup < 2000:
		maxBatchSize = 20
	default:
		maxBatchSize = 100
	}

	// 1 worker per batch
	workers := int(math.Ceil(float64(recordCount / maxBatchSize)))

	q := queue.NewPool(workers, queue.WithLogger(zerolog.New()))
	// shutdown the service and notify all the worker
	// wait all jobs are complete.
	defer q.Release()

	if maxBatchSize == 0 {
		maxBatchSize = 1000
	}

	skip := 0
	filesAmount := len(items)
	batchCount := int(math.Ceil(float64(filesAmount / maxBatchSize)))

	if wrkerconfig.Debug == "true" {
		log.Println("Workers:", workers, "Batch count (rounds):", batchCount, "Count:", filesAmount, "Batch size:", maxBatchSize)
	}

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
				for _, file := range batchItems {

					filecreate := ""
					directoryRun := ""
					// log.Println(file.FileName, file.FolderID, folderID, folder)
					/* Construct folder routes for any missing files that are not node base folder */
					if file.FolderID != folderID {

						// Look up folder structure
						newdir, err := filesystem.FolderConstructByID(database.DBConn, file.FolderID, environmentID, "pipelines")

						// log.Println("Worker new dir:", newdir)

						if err != nil {
							log.Println(err)
							return err
						}
						directoryRun = wrkerconfig.FSCodeDirectory + newdir
						filecreate = directoryRun + file.FileName

						/* Create folder if folder doesn't exist */
						if _, err := os.Stat(directoryRun); os.IsNotExist(err) {

							errdir := os.MkdirAll(directoryRun, 0700)
							if errdir != nil {
								log.Println(errdir)
								return errdir
							}
							if wrkerconfig.Debug == "true" {
								log.Println("Node dir not found - create:", directoryRun)
							}

						}

						/* Write file contents */
						errfile := ioutil.WriteFile(filecreate, file.FileStore, 0644)
						if errfile != nil {
							log.Println(errfile)
							textback <- msgback{
								Msg: errfile.Error(),
								Err: errfile,
							}
							continue
							// return errfile
						}

						md5, md5err := utilities.Hash_file_md5(filecreate)
						if md5err != nil {
							log.Println(md5err)
							textback <- msgback{
								Msg: md5err.Error(),
								Err: md5err,
							}
							continue
							// return md5err
						}

						if md5 != file.ChecksumMD5 {
							errtxt := "MD5 checksum mismatch: " + filecreate
							log.Println(errtxt)
							textback <- msgback{
								Msg: errtxt,
								Err: errors.New(errtxt),
							}
							continue
							// return errors.New(errtxt)
						}

						if wrkerconfig.Debug == "true" {
							log.Println(i, "Cache file:", filecreate)
						}

					} else {

						// Base folder already known
						directoryRun = wrkerconfig.FSCodeDirectory + folder
						filecreate = wrkerconfig.FSCodeDirectory + folder + file.FileName

						/* Create folder if folder doesn't exist */
						if _, err := os.Stat(directoryRun); os.IsNotExist(err) {

							errdir := os.MkdirAll(directoryRun, 0700)
							if errdir != nil {
								log.Println(errdir)
								return errdir
							}
							if wrkerconfig.Debug == "true" {
								log.Println("Node dir not found - create:", directoryRun)
							}

						}

						/* Write file contents */
						errfile := ioutil.WriteFile(filecreate, file.FileStore, 0644)
						if errfile != nil {
							log.Println(errfile)
							return errfile
						}

						md5, md5err := utilities.Hash_file_md5(filecreate)
						if md5err != nil {
							log.Println(md5err)
							return md5err
						}

						if md5 != file.ChecksumMD5 {
							errtxt := "MD5 checksum mismatch: " + filecreate
							log.Println(errtxt)
							return errors.New(errtxt)
						}

						if wrkerconfig.Debug == "true" {
							log.Println(i, "Cache file:", filecreate)
						}
					}

					/* */
					// writeCache = append(writeCache, &models.CodeFilesCache{
					// 	FileID:           file.FileID,
					// 	NodeID:           nodeID,
					// 	WorkerGroup:      wrkerconfig.WorkerGroup,
					// 	WorkerID:         wrkerconfig.WorkerID,
					// 	EnvironmentID:    environmentID,
					// 	ChecksumMD5Check: true,
					// })

					// Totalcount = Totalcount + 1
					// t = n
				}

				// Last batch
				elapsed := time.Since(start)
				textback <- msgback{
					Msg: fmt.Sprintf("Records written: %v | %s | batch: %v | %s", maxBatchSize, elapsed, i, time.Now()),
					Err: nil,
				}

				return nil
			}); err != nil {
				textback <- msgback{
					Msg: err.Error(),
					Err: err,
				}
				// log.Println(err)
			}
		}(i)

		skip += maxBatchSize
	}

	/* This will ensure all have been completed */
	for i := 1; i <= batchCount; i++ {
		writeout := <-textback
		if wrkerconfig.Debug == "true" {
			fmt.Println(writeout.Msg)
		}
	}

	if wrkerconfig.Debug == "true" {
		log.Println(fmt.Sprintf("Workers: %v | Total records: %v | Batch size: %v | Completed time: %s", workers, filesAmount, maxBatchSize, time.Since(starttop)))
	}

}
