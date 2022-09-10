package storage

import (
	"bytes"
	"context"
	"io"
	"io/ioutil"
	"strings"
	"sync"
	"time"
)

// NewMemoryFS creates a a basic in-memory implementation of FS.
func NewMemoryFS() FS {
	return &memoryFS{
		data: make(map[string]*memFile),
	}
}

type memFile struct {
	data  []byte
	attrs Attributes
}

func (f *memFile) readCloser() io.ReadCloser {
	return ioutil.NopCloser(bytes.NewReader(f.data))
}

type memoryFS struct {
	sync.RWMutex

	data map[string]*memFile
}

// Open implements FS.
func (m *memoryFS) Open(_ context.Context, path string, options *ReaderOptions) (*File, error) {
	m.RLock()
	f, ok := m.data[path]
	m.RUnlock()

	if ok {
		return &File{
			ReadCloser: f.readCloser(),
			Attributes: f.attrs,
		}, nil
	}

	return nil, &notExistError{
		Path: path,
	}
}

// Attributes implements FS.
func (m *memoryFS) Attributes(ctx context.Context, path string, options *ReaderOptions) (*Attributes, error) {
	m.RLock()
	f, ok := m.data[path]
	m.RUnlock()

	if ok {
		attrs := f.attrs

		return &attrs, nil
	}

	return nil, &notExistError{
		Path: path,
	}
}

type writingFile struct {
	*bytes.Buffer
	path string

	m       *memoryFS
	options *WriterOptions
}

func (wf *writingFile) Close() error {
	if wf.options.Attributes.Size == 0 {
		wf.options.Attributes.Size = int64(wf.Buffer.Len())
	}

	wf.m.Lock()
	// Record time with the lock so the time is accurate
	if wf.options.Attributes.ModTime.IsZero() {
		wf.options.Attributes.ModTime = time.Now()
	}
	wf.m.data[wf.path] = &memFile{
		data:  wf.Buffer.Bytes(),
		attrs: wf.options.Attributes,
	}
	wf.m.Unlock()

	return nil
}

// Create implements FS.  NB: Callers must close the io.WriteCloser to create the file.
func (m *memoryFS) Create(_ context.Context, path string, options *WriterOptions) (io.WriteCloser, error) {
	if options == nil {
		options = &WriterOptions{}
	}

	return &writingFile{
		Buffer:  &bytes.Buffer{},
		path:    path,
		m:       m,
		options: options,
	}, nil
}

// Delete implements FS.
func (m *memoryFS) Delete(_ context.Context, path string) error {
	m.Lock()
	delete(m.data, path)
	m.Unlock()

	return nil
}

// Walk implements FS.
func (m *memoryFS) Walk(_ context.Context, path string, fn WalkFn) error {
	var list []string
	m.RLock()
	for k := range m.data {
		if strings.HasPrefix(k, path) {
			list = append(list, k)
		}
	}
	m.RUnlock()

	for _, k := range list {
		if err := fn(k); err != nil {
			return err
		}
	}

	return nil
}

func (m *memoryFS) URL(ctx context.Context, path string, options *SignedURLOptions) (string, error) {
	return "", ErrNotImplemented
}
