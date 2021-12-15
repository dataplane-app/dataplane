package utilities

import (
	"os"
	"path/filepath"
	"strings"
)

func GetYAMLPaths(path string) (paths []string, err error) {
	// var paths []string
	err = filepath.WalkDir(path, func(p string, info os.DirEntry,
		err error) error {

		// If YAML perform checks, then apply
		if strings.HasSuffix(info.Name(), ".yaml") || strings.HasSuffix(info.Name(), ".yml") {
			paths = append(paths, p)
		}
		return err
	})
	return paths, err

}
