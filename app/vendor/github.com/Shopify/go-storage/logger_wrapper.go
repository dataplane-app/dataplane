package storage

import (
	"context"
	"fmt"
	"io"
)

// Logger can be a *log.Logger
type Logger interface {
	Print(v ...interface{})
}

// NewLoggerWrapper creates a new FS which logs all calls to FS.
func NewLoggerWrapper(fs FS, name string, l Logger) FS {
	return &loggerWrapper{
		fs:     fs,
		name:   name,
		logger: l,
	}
}

// loggerWrapper is an FS implementation which logs all filesystem calls.
type loggerWrapper struct {
	fs FS

	name   string
	logger Logger
}

func (l *loggerWrapper) printf(format string, v ...interface{}) {
	l.logger.Print(fmt.Sprintf(format, v...))
}

// Open implements FS.  All calls to Open are logged and errors are logged separately.
func (l *loggerWrapper) Open(ctx context.Context, path string, options *ReaderOptions) (*File, error) {
	l.printf("%v: open: %v", l.name, path)
	f, err := l.fs.Open(ctx, path, options)
	if err != nil {
		l.printf("%v: open error: %v: %v", l.name, path, err)
	}

	return f, err
}

// Attributes implements FS.
func (l *loggerWrapper) Attributes(ctx context.Context, path string, options *ReaderOptions) (*Attributes, error) {
	l.printf("%v: attrs: %v", l.name, path)
	a, err := l.fs.Attributes(ctx, path, options)
	if err != nil {
		l.printf("%v: attrs error: %v: %v", l.name, path, err)
	}

	return a, err
}

// Create implements FS.  All calls to Create are logged and errors are logged separately.
func (l *loggerWrapper) Create(ctx context.Context, path string, options *WriterOptions) (io.WriteCloser, error) {
	l.printf("%v: create: %v", l.name, path)
	wc, err := l.fs.Create(ctx, path, options)
	if err != nil {
		l.printf("%v: create error: %v: %v", l.name, path, err)
	}

	return wc, err
}

// Delete implements FS.  All calls to Delete are logged and errors are logged separately.
func (l *loggerWrapper) Delete(ctx context.Context, path string) error {
	l.printf("%v: delete: %v", l.name, path)
	err := l.fs.Delete(ctx, path)
	if err != nil {
		l.printf("%v: delete error: %v: %v", l.name, path, err)
	}

	return err
}

// Walk implements FS.  No logs are written at this time.
func (l *loggerWrapper) Walk(ctx context.Context, path string, fn WalkFn) error {
	return l.fs.Walk(ctx, path, fn)
}

func (l *loggerWrapper) URL(ctx context.Context, path string, options *SignedURLOptions) (string, error) {
	l.printf("%v: URL: %v", l.name, path)
	url, err := l.fs.URL(ctx, path, options)
	if err != nil {
		l.printf("%v: URL error: %v: %v", l.name, path, err)
	}

	return url, err
}
