package distfilesystem

import (
	wrkerconfig "dataplane/workers/config"
	"log"
	"os"
	"path/filepath"
)

/*
This will only be folder structure and not to do with database which will be done centrally in main app.
*/

func RemoveWorkerFolder(parentFolder string) error {

	if wrkerconfig.Debug == "true" {
		log.Println("Remove cached folders: ", wrkerconfig.FSCodeDirectory+parentFolder+"*")
	}

	contents, err := filepath.Glob(wrkerconfig.FSCodeDirectory + parentFolder + "*")
	if err != nil {
		return err
	}
	for _, item := range contents {
		err = os.RemoveAll(item)
		if err != nil {
			return err
		}
	}

	return nil
}
