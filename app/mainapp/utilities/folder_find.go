package utilities

import (
	"log"
	"os"
	"path/filepath"
	"regexp"
)

func FolderFindByID(id string) {

	libRegEx, e := regexp.Compile("^.+\\.(dylib)$")
	if e != nil {
		log.Fatal(e)
	}

	e = filepath.Walk("/usr/lib", func(path string, info os.FileInfo, err error) error {
		if err == nil && libRegEx.MatchString(info.Name()) {
			println(info.Name())
		}
		return nil
	})
	if e != nil {
		log.Fatal(e)
	}

}
