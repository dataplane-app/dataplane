package storage

import (
	"context"
	"expvar"
	"io"
)

const (
	StatOpenTotal    = "open.total"
	StatOpenErrors   = "open.errors"
	StatAttrsTotal   = "attrs.total"
	StatAttrsErrors  = "attrs.errors"
	StatCreateTotal  = "create.total"
	StatCreateErrors = "create.errors"
	StatDeleteTotal  = "delete.total"
	StatDeleteErrors = "delete.errors"
	StatURLTotal     = "url.total"
	StatURLErrors    = "url.errors"
)

// NewStatsWrapper creates an FS which records accesses for an FS.
// To retrieve the stats:
// stats := expvar.Get(name).(*expvar.Map)
// total := stats.Get("open.total").(*expvar.Int).Value() // int64
func NewStatsWrapper(fs FS, name string) FS {
	status := expvar.NewMap(name)
	status.Set(StatOpenTotal, new(expvar.Int))
	status.Set(StatOpenErrors, new(expvar.Int))

	status.Set(StatAttrsTotal, new(expvar.Int))
	status.Set(StatAttrsErrors, new(expvar.Int))

	status.Set(StatCreateTotal, new(expvar.Int))
	status.Set(StatCreateErrors, new(expvar.Int))

	status.Set(StatDeleteTotal, new(expvar.Int))
	status.Set(StatDeleteErrors, new(expvar.Int))

	status.Set(StatURLTotal, new(expvar.Int))
	status.Set(StatURLErrors, new(expvar.Int))

	return &statsWrapper{
		fs:     fs,
		status: status,
	}
}

// statsWrapper is an FS which records accesses for an FS.
type statsWrapper struct {
	fs     FS
	status *expvar.Map
}

// Open implements FS.  All errors from Open are counted.
func (s *statsWrapper) Open(ctx context.Context, path string, options *ReaderOptions) (*File, error) {
	f, err := s.fs.Open(ctx, path, options)
	if err != nil {
		s.status.Add(StatOpenErrors, 1)
	}
	s.status.Add(StatOpenTotal, 1)

	return f, err
}

// Attributes implements FS.  All errors from Attributes are counted.
func (s *statsWrapper) Attributes(ctx context.Context, path string, options *ReaderOptions) (*Attributes, error) {
	a, err := s.fs.Attributes(ctx, path, options)
	if err != nil {
		s.status.Add(StatAttrsErrors, 1)
	}
	s.status.Add(StatAttrsTotal, 1)

	return a, err
}

// Create implements FS.  All errors from Create are counted.
func (s *statsWrapper) Create(ctx context.Context, path string, options *WriterOptions) (io.WriteCloser, error) {
	wc, err := s.fs.Create(ctx, path, options)
	if err != nil {
		s.status.Add(StatCreateErrors, 1)
	}
	s.status.Add(StatCreateTotal, 1)

	return wc, err
}

// Delete implements FS.  All errors from Delete are counted.
func (s *statsWrapper) Delete(ctx context.Context, path string) error {
	err := s.fs.Delete(ctx, path)
	if err != nil {
		s.status.Add(StatDeleteErrors, 1)
	}
	s.status.Add(StatDeleteTotal, 1)

	return err
}

// Walk implements FS.  No stats are recorded at this time.
func (s *statsWrapper) Walk(ctx context.Context, path string, fn WalkFn) error {
	return s.fs.Walk(ctx, path, fn)
}

func (s *statsWrapper) URL(ctx context.Context, path string, options *SignedURLOptions) (string, error) {
	url, err := s.fs.URL(ctx, path, options)
	if err != nil {
		s.status.Add(StatURLErrors, 1)
	}
	s.status.Add(StatURLTotal, 1)

	return url, err
}
