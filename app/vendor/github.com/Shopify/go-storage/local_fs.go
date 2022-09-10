package storage

import (
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
)

// DefaultLocalCreatePathMode is the default os.FileMode used when creating directories
// during a localFS.Create call.
const DefaultLocalCreatePathMode = os.FileMode(0o755)

// LocalCreatePathMode is the os.FileMode used when creating directories via localFS.Create
var LocalCreatePathMode = DefaultLocalCreatePathMode

// localFS is a local FS and Walker implementation.
type localFS string

func NewLocalFS(path string) FS {
	fs := localFS(path)

	return &fs
}

func (l *localFS) fullPath(path string) string {
	return filepath.Join(string(*l), path)
}

func (l *localFS) wrapError(path string, err error) error {
	if os.IsNotExist(err) {
		return &notExistError{
			Path: path,
		}
	}

	return err
}

// Open implements FS.
func (l *localFS) Open(_ context.Context, path string, options *ReaderOptions) (*File, error) {
	path = l.fullPath(path)

	f, err := os.Open(path)
	if err != nil {
		return nil, l.wrapError(path, err)
	}

	stat, err := f.Stat()
	if err != nil {
		return nil, l.wrapError(path, err)
	}

	return &File{
		ReadCloser: f,
		Attributes: Attributes{
			ModTime: stat.ModTime(),
			Size:    stat.Size(),
		},
	}, nil
}

// Attributes implements FS.
func (l *localFS) Attributes(ctx context.Context, path string, options *ReaderOptions) (*Attributes, error) {
	path = l.fullPath(path)

	stat, err := os.Stat(path)
	if err != nil {
		return nil, l.wrapError(path, err)
	}

	return &Attributes{
		ModTime: stat.ModTime(),
		Size:    stat.Size(),
	}, nil
}

// Create implements FS.  If the path contains any directories which do not already exist
// then Create will try to make them, returning an error if it fails.
func (l *localFS) Create(_ context.Context, path string, options *WriterOptions) (io.WriteCloser, error) {
	path = l.fullPath(path)

	dir := filepath.Dir(path)
	if _, err := os.Stat(dir); os.IsNotExist(err) {
		if err := os.MkdirAll(dir, LocalCreatePathMode); err != nil {
			return nil, err
		}
	}

	f, err := os.Create(path)
	if err != nil {
		return nil, err
	}
	if options != nil {
		if !options.Attributes.CreationTime.IsZero() {
			// There is no way to store the CreationTime, so overwrite the ModTime
			// This is necessary so the CacheWrapper can use LocalFS
			options.Attributes.ModTime = options.Attributes.CreationTime
		}
		if !options.Attributes.ModTime.IsZero() {
			if err := os.Chtimes(path, options.Attributes.ModTime, options.Attributes.ModTime); err != nil {
				return f, err
			}
		}
	}

	return f, nil
}

// Delete implements FS.  All files underneath path will be removed.
func (l *localFS) Delete(_ context.Context, path string) error {
	return os.RemoveAll(l.fullPath(path))
}

// Walk implements Walker.
func (l *localFS) Walk(_ context.Context, path string, fn WalkFn) error {
	return filepath.Walk(l.fullPath(path), func(path string, f os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if !f.IsDir() {
			path = strings.TrimPrefix(path, string(*l))

			return fn(path)
		}

		return nil
	})
}

func (l *localFS) URL(ctx context.Context, path string, options *SignedURLOptions) (string, error) {
	path = l.fullPath(path)
	_, err := os.Stat(path)
	if err != nil {
		return "", l.wrapError(path, err)
	}

	return fmt.Sprintf("file://%s", path), nil
}
