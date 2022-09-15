package distributefilesystem

import (
	"crypto/md5"
	"dataplane/mainapp/code_editor/filesystem"
	"dataplane/mainapp/config"
	"dataplane/mainapp/database"
	"dataplane/mainapp/database/models"
	"fmt"
	"log"
	"os"

	"gorm.io/gorm"
)

/*
Move code files from shared storage to distributed storage
0. On start - if there is no default file_system, move files to DB

1. Get all the files and locations in the db - tables: code_files, code_folders

2. Compare to all the files - Table: code_file_store

3. For all the missing files, collect each file and store in table code_file_store
*/

func MoveCodeFilesToDB(db *gorm.DB) error {

	var existingFile []*models.CodeFiles

	query := `
	SELECT  f.file_id, f.environment_id
		FROM    code_files f
		WHERE   NOT EXISTS
        (
        SELECT  file_id
        FROM    code_files_store cs
        WHERE   f.file_id = cs.file_id
        )
		`
	db.Raw(query).Scan(&existingFile)

	log.Println("Number of code files to move:", len(existingFile))

	for _, x := range existingFile {
		// log.Println(x.FileID, x.EnvironmentID)

		// Open each file
		fileLoc, _ := filesystem.FileConstructByID(db, x.FileID, x.EnvironmentID, "pipelines")

		dat, err := os.ReadFile(config.CodeDirectory + fileLoc)
		if err != nil {
			log.Println("Read file error:", err)
		} else {

			md5byte := md5.Sum(dat)
			md5string := fmt.Sprintf("%x", md5byte)

			codefile := models.CodeFilesStore{
				FileID:        x.FileID,
				FileStore:     dat,
				ChecksumMD5:   md5string,
				EnvironmentID: x.EnvironmentID,
			}

			errdb := database.DBConn.Create(&codefile).Error
			if errdb != nil {
				log.Println("Create file in database:", err)
			} else {
				log.Println("DF add: ", md5string, config.CodeDirectory+fileLoc)
			}
		}

	}
	return nil
}
