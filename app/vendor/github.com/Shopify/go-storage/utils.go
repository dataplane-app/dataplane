package storage

import (
	"context"
	"fmt"
	"io"
	"io/ioutil"
)

func Read(ctx context.Context, fs FS, path string, options *ReaderOptions) ([]byte, error) {
	var file *File
	var err error

	if file, err = fs.Open(ctx, path, options); err != nil {
		return nil, fmt.Errorf("unable to open %s: %w", path, err)
	}

	var data []byte
	if data, err = ioutil.ReadAll(file); err != nil {
		_ = file.Close() // Best effort at cleaning up

		return nil, fmt.Errorf("unable to read %s: %w", path, err)
	}

	if err = file.Close(); err != nil {
		return data, fmt.Errorf("unable to close %s: %w", path, err)
	}

	return data, nil
}

func Write(ctx context.Context, fs FS, path string, data []byte, options *WriterOptions) error {
	var w io.WriteCloser
	var err error

	if w, err = fs.Create(ctx, path, options); err != nil {
		return fmt.Errorf("unable to create %s: %w", path, err)
	}

	if _, err = w.Write(data); err != nil {
		_ = w.Close() // Best effort at cleaning up

		return fmt.Errorf("unable to write %s: %w", path, err)
	}

	if err = w.Close(); err != nil {
		return fmt.Errorf("unable to close %s: %w", path, err)
	}

	return nil
}

func Exists(ctx context.Context, fs FS, path string) bool {
	attrs, _ := fs.Attributes(ctx, path, nil)

	return attrs != nil
}
