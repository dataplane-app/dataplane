package storage

import (
	"context"
	"io"
	"time"
)

// NewSlowWrapper creates an artificially slow FS.
// Probably only useful for testing.
func NewSlowWrapper(fs FS, readDelay time.Duration, writeDelay time.Duration) FS {
	return &slowWrapper{
		fs:         fs,
		readDelay:  readDelay,
		writeDelay: writeDelay,
	}
}

type slowWrapper struct {
	fs         FS
	readDelay  time.Duration
	writeDelay time.Duration
}

func (fs *slowWrapper) Open(ctx context.Context, path string, options *ReaderOptions) (*File, error) {
	select {
	case <-time.After(fs.readDelay):
		return fs.fs.Open(ctx, path, options)
	case <-ctx.Done():
		return nil, ctx.Err()
	}
}

func (fs *slowWrapper) Walk(ctx context.Context, path string, fn WalkFn) error {
	select {
	case <-time.After(fs.readDelay):
		return fs.fs.Walk(ctx, path, fn)
	case <-ctx.Done():
		return ctx.Err()
	}
}

func (fs *slowWrapper) Attributes(ctx context.Context, path string, options *ReaderOptions) (*Attributes, error) {
	select {
	case <-time.After(fs.readDelay):
		return fs.fs.Attributes(ctx, path, options)
	case <-ctx.Done():
		return nil, ctx.Err()
	}
}

func (fs *slowWrapper) Create(ctx context.Context, path string, options *WriterOptions) (io.WriteCloser, error) {
	select {
	case <-time.After(fs.writeDelay):
		return fs.fs.Create(ctx, path, options)
	case <-ctx.Done():
		return nil, ctx.Err()
	}
}

func (fs *slowWrapper) Delete(ctx context.Context, path string) error {
	select {
	case <-time.After(fs.writeDelay):
		return fs.fs.Delete(ctx, path)
	case <-ctx.Done():
		return ctx.Err()
	}
}

func (fs *slowWrapper) URL(ctx context.Context, path string, options *SignedURLOptions) (string, error) {
	select {
	case <-time.After(fs.readDelay):
		return fs.fs.URL(ctx, path, options)
	case <-ctx.Done():
		return "", ctx.Err()
	}
}
