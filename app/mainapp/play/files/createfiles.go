package main

import (
	"dataplane/mainapp/utilities"
	"encoding/json"
	"fmt"
	"log"
	"math"

	"github.com/bxcodec/faker/v4"
	"github.com/google/uuid"
)

// SomeStructWithTags ...
type SomeStructWithTags struct {
	Email              string  `faker:"email"`
	PhoneNumber        string  `faker:"phone_number"`
	Name               string  `faker:"name"`
	Timestamp          string  `faker:"timestamp"`
	TimeZone           string  `faker:"timezone"`
	Currency           string  `faker:"currency"`
	Amount             float64 `faker:"amount"`
	Century            string  `faker:"century"`
	TimePeriod         string  `faker:"time_period"`
	Word               string  `faker:"word"`
	Sentence           string  `faker:"sentence"`
	Paragraph          string  `faker:"paragraph"`
	AmountWithCurrency string  `faker:"amount_with_currency"`
	UUIDHypenated      string  `faker:"uuid_hyphenated"`
	UUID               string  `faker:"uuid_digit"`
}

func CreateFiles() {

	// To delete these files:
	// find /home/testfiles/ -name "*.json" -delete

	rootFolder := "/home/testfiles/"

	// Write data from io.Reader into hello.txt
	recordCount := 280000
	data := make([]SomeStructWithTags, recordCount)

	log.Println("Empty Length: ", len(data))

	// os.Exit(0)

	var filedata []utilities.FileContent
	for _, x := range data {

		err := faker.FakeData(&x)
		if err != nil {
			fmt.Println(err)
		}

		file, _ := json.MarshalIndent(x, "", " ")
		filedata = append(filedata, utilities.FileContent{
			FileName: uuid.NewString() + ".json",
			Content:  file,
		})
	}

	log.Println("Filled Length: ", len(filedata))

	// Workers: 50 | Total records: 10000 | Batch size: 200 | Completed time: 543.550332ms
	// Workers: 500 | Total records: 100000 | Batch size: 200 | Completed time: 8.60084105s
	// Workers: 100 | Total records: 100000 | Batch size: 1000 | Completed time: 6.785019404s
	// Workers: 66 | Total records: 100000 | Batch size: 1500 | Completed time: 5.85279878s
	// Workers: 33 | Total records: 100000 | Batch size: 3000 | Completed time: 5.053722329s

	// 500,000
	// Workers: 500 | Total records: 500000 | Batch size: 1000 | Completed time: 25.431488901s
	// Workers: 250 | Total records: 500000 | Batch size: 2000 | Completed time: 19.973049984s
	// Workers: 100 | Total records: 500000 | Batch size: 5000 | Completed time: 20.958687425s
	batchSize := 1
	switch lookup := recordCount; { // missing expression means "true"
	case lookup < 5000:
		batchSize = 100
	case lookup < 10000:
		batchSize = 1000
	case lookup < 50000:
		batchSize = 2000
	case lookup < 500000:
		batchSize = 2000
	default:
		batchSize = 100
	}

	// 1 worker per batch
	workers := int(math.Ceil(float64(recordCount / batchSize)))
	log.Println("Number of workers: ", workers)
	utilities.BatchFileWriteOld(workers, batchSize, filedata, rootFolder)

	log.Println("Complete.")

	// mem := storage.NewMemoryFS()

	// wc, err := mem.Create(context.Background(), "file.txt", nil)
	// if err != nil {
	// 	// ...
	// }

	// if _, err := io.WriteString(wc, string(file)); err != nil {
	// 	// ...
	// }
	// if err := wc.Close(); err != nil {
	// 	// ...
	// }
}
