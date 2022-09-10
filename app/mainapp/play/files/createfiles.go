package main

import (
	"dataplane/mainapp/utilities"
	"encoding/json"
	"fmt"
	"log"

	"github.com/bxcodec/faker/v4"
	"github.com/google/uuid"
)

// SomeStructWithTags ...
type SomeStructWithTags struct {
	Latitude    float32 `faker:"lat"`
	Longitude   float32 `faker:"long"`
	Email       string  `faker:"email"`
	PhoneNumber string  `faker:"phone_number"`
	TitleMale   string  `faker:"title_male"`
	FirstName   string  `faker:"first_name"`
	LastName    string  `faker:"last_name"`
	Name        string  `faker:"name"`
	Timestamp   string  `faker:"timestamp"`
	TimeZone    string  `faker:"timezone"`
	Currency    string  `faker:"currency"`
	Amount      float64 `faker:"amount"`
}

func CreateFiles() {

	// To delete these files:
	// find /home/testfiles/ -name "*.json" -delete

	rootFolder := "/home/testfiles/"

	// Write data from io.Reader into hello.txt
	data := make([]SomeStructWithTags, 250000)

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

	// log.Println(string(file))
	utilities.BatchFileWrite(500, 1000, filedata, rootFolder)

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

func main() {
	CreateFiles()
}
