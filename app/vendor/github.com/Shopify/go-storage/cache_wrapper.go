package storage

import (
	"context"
	"io"
	"time"
)

type CacheOptions struct {
	// MaxAge is the maximum time allowed since the underlying File's ModTime
	// This means that if the cache is older than MaxAge, the Cache will fetch from the src again.
	// If the expired File is still present on the src (i.e. not updated), it will be ignored.
	MaxAge time.Duration

	// DefaultExpired makes the cache treat a File as expired if its CreationTime cannot be checked.
	// By default, it is false, which means the cache will treat zero-CreationTime files as valid.
	// Only useful if MaxAge is set.
	DefaultExpired bool

	// NoData disables caching of the contents of the entries, it only stores the metadata.
	NoData bool
}

// NewCacheWrapper creates an FS implementation which caches files opened from src into cache.
func NewCacheWrapper(src, cache FS, options *CacheOptions) FS {
	if options == nil {
		options = &CacheOptions{}
	}

	return &cacheWrapper{
		src:     src,
		cache:   cache,
		options: options,
	}
}

type openForwarder struct {
	src func() (io.ReadCloser, error)
	rc  io.ReadCloser
}

func (f *openForwarder) open() error {
	if f.rc != nil {
		return nil
	}

	rc, err := f.src()
	if err != nil {
		return err
	}
	f.rc = rc

	return nil
}

func (f *openForwarder) Read(p []byte) (n int, err error) {
	if err = f.open(); err != nil {
		return 0, err
	}

	return f.rc.Read(p)
}

func (f *openForwarder) Close() (err error) {
	if f.rc == nil {
		return nil
	}

	return f.rc.Close()
}

type cacheWrapper struct {
	src     FS
	cache   FS
	options *CacheOptions
}

func (c *cacheWrapper) isExpired(file *File) bool {
	if c.options.MaxAge == 0 {
		// No expiration behavior
		return false
	}

	creationTime := file.CreationTime
	if creationTime.IsZero() {
		creationTime = file.ModTime // Fallback to ModTime
	}
	if creationTime.IsZero() {
		return c.options.DefaultExpired
	}

	return time.Since(creationTime) > c.options.MaxAge
}

func (c *cacheWrapper) openCache(ctx context.Context, path string, options *ReaderOptions) (*File, error) {
	f, err := c.cache.Open(ctx, path, options)
	if err != nil {
		return nil, err
	}
	if c.options.NoData {
		// Override the ReadCloser to actually fetch from the src
		// If Read is not called, it still allows to read the attributes
		f.ReadCloser = &openForwarder{
			src: func() (io.ReadCloser, error) {
				return c.src.Open(ctx, path, options)
			},
		}
	}

	return f, nil
}

// Open implements FS.
func (c *cacheWrapper) Open(ctx context.Context, path string, options *ReaderOptions) (*File, error) {
	f, err := c.openCache(ctx, path, options)
	if err == nil {
		if !c.isExpired(f) {
			return f, nil
		}
	} else if !IsNotExist(err) {
		return nil, err
	}

	sf, err := c.src.Open(ctx, path, options)
	if err != nil {
		return nil, err
	}
	defer sf.Close()

	cacheAttrs := sf.Attributes
	cacheAttrs.CreationTime = time.Now() // The cache requires the CreationTime, so the original value is overwritten
	wc, err := c.cache.Create(ctx, path, &WriterOptions{
		Attributes: cacheAttrs,
	})
	if err != nil {
		return nil, err
	}

	if !c.options.NoData {
		if _, err := io.Copy(wc, sf); err != nil {
			wc.Close()

			return nil, err
		}
	}

	if err := wc.Close(); err != nil {
		return nil, err
	}

	ff, err := c.openCache(ctx, path, options)
	if err != nil {
		return nil, err
	}

	return ff, nil
}

// Attributes implements FS.
func (c *cacheWrapper) Attributes(ctx context.Context, path string, options *ReaderOptions) (*Attributes, error) {
	f, err := c.Open(ctx, path, options)
	if err != nil {
		return nil, err
	}

	return &f.Attributes, nil
}

// Delete implements FS.
func (c *cacheWrapper) Delete(ctx context.Context, path string) error {
	err := c.cache.Delete(ctx, path)
	if err != nil && !IsNotExist(err) {
		return err
	}

	return c.src.Delete(ctx, path)
}

// Create implements FS.
func (c *cacheWrapper) Create(ctx context.Context, path string, options *WriterOptions) (io.WriteCloser, error) {
	err := c.cache.Delete(ctx, path)
	if err != nil && !IsNotExist(err) {
		return nil, err
	}

	return c.src.Create(ctx, path, options)
}

// Walk implements FS.
func (c *cacheWrapper) Walk(ctx context.Context, path string, fn WalkFn) error {
	return c.src.Walk(ctx, path, fn)
}

func (c *cacheWrapper) URL(ctx context.Context, path string, options *SignedURLOptions) (string, error) {
	// Pass-through
	return c.src.URL(ctx, path, options)
}
