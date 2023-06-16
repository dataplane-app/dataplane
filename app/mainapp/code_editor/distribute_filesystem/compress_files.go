package distributefilesystem

import (
	"archive/tar"
	"bytes"
	"log"

	"github.com/dataplane-app/dataplane/app/mainapp/database/models"
	"github.com/klauspost/compress/s2"
)

func CompressTarS2(FilesOutput []models.CodeFilesCompress) ([]byte, int, error) {

	tarbuf := new(bytes.Buffer)
	// Create a new tar writer using the in-memory buffer as the output stream
	tarWriter := tar.NewWriter(tarbuf)
	defer tarWriter.Close()

	// Loop through the list of files and add them to the tar archive
	for _, file := range FilesOutput {

		// Create a tar header for the file
		header := &tar.Header{
			Name: file.FolderPath + file.FileName,
			Size: int64(len(file.FileStore)),
		}

		// Write the header to the tar archive
		if err := tarWriter.WriteHeader(header); err != nil {
			log.Println("failed to write tar header", err)
			return nil, 0, err
		}

		// Write the file data to the tar archive
		if _, err := tarWriter.Write(file.FileStore); err != nil {
			log.Println("failed to write file data to tar", err)
			return nil, 0, err
		}
	}

	// log.Println("Tar file: ", tarbuf.Len())

	s2buf := new(bytes.Buffer)
	s2compress := s2.NewWriter(s2buf)

	// The encoder owns the buffer until Flush or Close is called.
	_, err := s2compress.Write(tarbuf.Bytes())
	if err != nil {
		log.Println("Compression error:", err)
		s2compress.Close()
		return nil, 0, err
	}
	err = s2compress.Close()
	if err != nil {
		log.Println("Compression close error:", err)
		return nil, 0, err
	}

	// log.Println("S2 compressed file: ", intR, s2buf.Len())

	return s2buf.Bytes(), s2buf.Len(), nil
}
