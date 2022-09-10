package storage

import (
	"context"
	"io"
	"time"
)

// NewTimeoutWrapper creates a FS which wraps fs and adds a timeout to most operations:
// read: Open, Attributes, URL
// write: Create, Delete
//
// Note that the Open and Create methods are only for resolving the object, NOT actually reading or writing the contents.
// These operations should be fairly quick, on the same order as Attribute and Delete, respectively.
//
// This depends on the underlying implementation to honour context's errors.
// It is at least supported on the CloudStorageFS.
//
// Walk is not covered, since its duration is highly unpredictable.
func NewTimeoutWrapper(fs FS, read time.Duration, write time.Duration) FS {
	return &timeoutWrapper{
		fs:    fs,
		read:  read,
		write: write,
	}
}

type timeoutWrapper struct {
	fs    FS
	read  time.Duration
	write time.Duration
}

// timeoutCall watches the context to be sure it's not Done yet,
// but does NOT modify the context being passed to the underlying call.
// This is important, because the context needs to continue to be alive while the returned object (File, Writer, etc)
// is being used by the caller.
func timeoutCall(ctx context.Context, timeout time.Duration, call func() (interface{}, error)) (interface{}, error) {
	var out interface{}
	var err error
	done := make(chan struct{})
	go func() {
		out, err = call()
		close(done)
	}()

	select {
	case <-time.After(timeout):
		return nil, context.DeadlineExceeded
	case <-ctx.Done():
		return nil, ctx.Err()
	case <-done:
		return out, err
	}
}

// Open implements FS.
func (t *timeoutWrapper) Open(ctx context.Context, path string, options *ReaderOptions) (*File, error) {
	out, err := timeoutCall(ctx, t.read, func() (interface{}, error) {
		return t.fs.Open(ctx, path, options)
	})
	if file, ok := out.(*File); ok {
		return file, err
	}

	return nil, err
}

// Attributes() implements FS.
func (t *timeoutWrapper) Attributes(ctx context.Context, path string, options *ReaderOptions) (*Attributes, error) {
	out, err := timeoutCall(ctx, t.read, func() (interface{}, error) {
		return t.fs.Attributes(ctx, path, options)
	})
	if attrs, ok := out.(*Attributes); ok {
		return attrs, err
	}

	return nil, err
}

// Create implements FS.
func (t *timeoutWrapper) Create(ctx context.Context, path string, options *WriterOptions) (io.WriteCloser, error) {
	out, err := timeoutCall(ctx, t.write, func() (interface{}, error) {
		return t.fs.Create(ctx, path, options)
	})
	if w, ok := out.(io.WriteCloser); ok {
		return w, err
	}

	return nil, err
}

// Delete implements FS.
func (t *timeoutWrapper) Delete(ctx context.Context, path string) error {
	_, err := timeoutCall(ctx, t.write, func() (interface{}, error) {
		return nil, t.fs.Delete(ctx, path)
	})

	return err
}

// Walk transverses all paths underneath path, calling fn on each visited path.
func (t *timeoutWrapper) Walk(ctx context.Context, path string, fn WalkFn) error {
	return t.fs.Walk(ctx, path, fn)
}

func (t *timeoutWrapper) URL(ctx context.Context, path string, options *SignedURLOptions) (string, error) {
	out, err := timeoutCall(ctx, t.write, func() (interface{}, error) {
		return t.fs.URL(ctx, path, options)
	})
	if url, ok := out.(string); ok {
		return url, err
	}

	return "", err
}
