package distributefilesystem

import (
	"archive/tar"
	"bytes"
	"crypto/md5"
	"encoding/hex"
	"fmt"
	"io"

	"github.com/dataplane-app/dataplane/app/mainapp/database/models"
	"github.com/klauspost/compress/s2"
)

func DecompressTarS2(s2file *bytes.Buffer) ([]models.CodeFilesCompress, error) {

	var files []models.CodeFilesCompress

	/* Decompress S2 */
	tarfile := s2.NewReader(s2file)

	// err := tarfile
	// log.Println("Tar file:", tarfile)

	/* Untar directory */
	tr := tar.NewReader(tarfile)
	for {
		hdr, err := tr.Next()
		if err == io.EOF {
			break // End of archive
		}
		if err != nil {
			return []models.CodeFilesCompress{}, err
		}
		fmt.Printf("Contents of %s:\n", hdr.Name)

		buf := new(bytes.Buffer)
		if _, err := io.Copy(buf, tr); err != nil {
			return []models.CodeFilesCompress{}, err
		}

		hash := md5.Sum(buf.Bytes())
		md5 := hex.EncodeToString(hash[:])

		files = append(files, models.CodeFilesCompress{
			FileName:    hdr.Name,
			FileStore:   buf.Bytes(),
			ChecksumMD5: md5,
		})
		fmt.Println("decompress bytes length: ", buf.Len(), md5)
	}

	return files, nil
}
