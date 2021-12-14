package main

import (
	pipelines "dataplane/pipelines/components"
	"dataplane/utilities"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
	"strings"

	"gopkg.in/yaml.v2"
)

func main() {
	paths, _ := LoadYAML(os.Getenv("dataplane_pipelines_folder"))
	log.Println(paths)
}

func LoadYAML(path string) ([]string, error) {
	var paths []string
	err := filepath.WalkDir(path, func(p string, info os.DirEntry,
		err error) error {

		log.Println(info.Name())

		// If YAML perform checks, then apply
		if strings.HasSuffix(info.Name(), ".yaml") || strings.HasSuffix(info.Name(), ".yml") {
			// paths = append(paths, p)
			b, err := ioutil.ReadFile(p)
			if err != nil {
				log.Println("An error occurred")
			}
			log.Println(info.Name(), " - ", utilities.ByteCountSI(int64(len(b))))

			// Unmarshal the YAML
			pipeline := pipelines.PipelineYAML{}
			err = yaml.Unmarshal(b, &pipeline)
			if err != nil {
				log.Fatalf("error: %v", err)
			}
			fmt.Printf("%+v\n", pipeline)

			// Marshal to json
			res2B, _ := json.Marshal(pipeline)
			fmt.Println("json:", string(res2B))

		}
		return err
	})
	return paths, err
}

// apiVersion: apps/v1
// kind: Pipeline
// metadata:
//   name: clean-logs
//   description: "A flow to clean out logs"
//   # Version needs to be unique
//   version: v0.0.1
//   tags:
//     - hello
//     - hashtag
// spec:
//   schedule: "*/30 * * * *"
//   schedule_type: "crontab"

// package main

// import (
//         "fmt"
//         "log"

//         "gopkg.in/yaml.v2"
// )

// var data = `
// a: Easy!
// b:
//   c: 2
//   d: [3, 4]
// `

// // Note: struct fields must be public in order for unmarshal to
// // correctly populate the data.
// type T struct {
//         A string
//         B struct {
//                 RenamedC int   `yaml:"c"`
//                 D        []int `yaml:",flow"`
//         }
// }

// func main() {
//         t := T{}

//         err := yaml.Unmarshal([]byte(data), &t)
//         if err != nil {
//                 log.Fatalf("error: %v", err)
//         }
//         fmt.Printf("--- t:\n%v\n\n", t)

//         d, err := yaml.Marshal(&t)
//         if err != nil {
//                 log.Fatalf("error: %v", err)
//         }
//         fmt.Printf("--- t dump:\n%s\n\n", string(d))

//         m := make(map[interface{}]interface{})

//         err = yaml.Unmarshal([]byte(data), &m)
//         if err != nil {
//                 log.Fatalf("error: %v", err)
//         }
//         fmt.Printf("--- m:\n%v\n\n", m)

//         d, err = yaml.Marshal(&m)
//         if err != nil {
//                 log.Fatalf("error: %v", err)
//         }
//         fmt.Printf("--- m dump:\n%s\n\n", string(d))
// }
