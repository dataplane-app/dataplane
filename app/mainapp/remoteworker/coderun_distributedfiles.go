package remoteworker

import (
	"log"

	distributefilesystem "github.com/dataplane-app/dataplane/app/mainapp/code_editor/distribute_filesystem"
	"github.com/dataplane-app/dataplane/app/mainapp/code_editor/filesystem"
	"github.com/dataplane-app/dataplane/app/mainapp/database/models"
	"gorm.io/gorm"
)

func CodeRunCompressCodeFiles(db *gorm.DB, nodeID string, environmentID string) ([]byte, int, error) {

	/* Download the files for this node */
	FilesOutput := []models.CodeFilesCompress{}
	query := `
			select 
			cf.file_id, 
			cf.folder_id, 
			cf.file_name, 
			cs.checksum_md5,
			cs.file_store
			from code_files cf, code_files_store cs
			where 
			cf.file_id = cs.file_id 
			and cf.environment_id = cs.environment_id 
			and cf.node_id = ? and cs.run_include = true
			and cf.environment_id = ?
			`

	err := db.Raw(query, nodeID, environmentID).Scan(&FilesOutput).Error
	if err != nil {
		log.Println("Download cached files: ", err)
		return nil, 0, err
	}

	/* Add files to tar file */
	for i, file := range FilesOutput {

		newdir, err := filesystem.NodeLevelFolderConstructByID(db, file.FolderID, environmentID)
		if err != nil {
			log.Println(err)
			return nil, 0, err
		}

		/* prefix folder with run type */
		FilesOutput[i].FolderPath = newdir

	}

	output, filesize, err := distributefilesystem.CompressTarS2(FilesOutput)
	if err != nil {
		return nil, 0, err
	}

	return output, filesize, nil
}
