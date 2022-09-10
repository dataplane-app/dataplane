package storage

import (
	"context"
	"errors"
	"fmt"
	"io"
	"sync"
	"time"

	gstorage "cloud.google.com/go/storage"
	"golang.org/x/oauth2/google"
	"google.golang.org/api/googleapi"
	"google.golang.org/api/iterator"
	"google.golang.org/api/option"
)

// NewCloudStorageFS creates a Google Cloud Storage FS
// credentials can be nil to use the default GOOGLE_APPLICATION_CREDENTIALS
func NewCloudStorageFS(bucket string, credentials *google.Credentials) FS {
	return &cloudStorageFS{
		bucketName:  bucket,
		credentials: credentials,
	}
}

// cloudStorageFS implements FS and uses Google Cloud Storage as the underlying
// file storage.
type cloudStorageFS struct {
	bucketName  string
	credentials *google.Credentials

	bucketLock   sync.RWMutex
	bucket       *gstorage.BucketHandle
	bucketScopes Scope
}

func (c *cloudStorageFS) URL(ctx context.Context, path string, options *SignedURLOptions) (string, error) {
	if options == nil {
		options = &SignedURLOptions{}
	}
	options.applyDefaults()

	b, err := c.bucketHandle(ctx, ScopeSignURL)
	if err != nil {
		return "", err
	}

	return b.SignedURL(path, &gstorage.SignedURLOptions{
		Method:  options.Method,
		Expires: time.Now().Add(options.Expiry),
	})
}

// Open implements FS.
func (c *cloudStorageFS) Open(ctx context.Context, path string, options *ReaderOptions) (*File, error) {
	b, err := c.bucketHandle(ctx, ScopeRead)
	if err != nil {
		return nil, err
	}

	obj := b.Object(path)
	if options != nil {
		obj = obj.ReadCompressed(options.ReadCompressed)
	}

	f, err := obj.NewReader(ctx)
	if err != nil {
		if errors.Is(err, gstorage.ErrObjectNotExist) {
			return nil, &notExistError{
				Path: path,
			}
		}

		return nil, err
	}

	return &File{
		ReadCloser: f,
		Attributes: Attributes{
			ContentType:     f.Attrs.ContentType,
			ContentEncoding: f.Attrs.ContentEncoding,
			ModTime:         f.Attrs.LastModified,
			Size:            f.Attrs.Size,
		},
	}, nil
}

// Attributes implements FS.
func (c *cloudStorageFS) Attributes(ctx context.Context, path string, options *ReaderOptions) (*Attributes, error) {
	b, err := c.bucketHandle(ctx, ScopeRead)
	if err != nil {
		return nil, err
	}

	a, err := b.Object(path).Attrs(ctx)
	if err != nil {
		return nil, err
	}

	return &Attributes{
		ContentType:     a.ContentType,
		ContentEncoding: a.ContentEncoding,
		Metadata:        a.Metadata,
		ModTime:         a.Updated,
		CreationTime:    a.Created,
		Size:            a.Size,
	}, nil
}

// Create implements FS.
func (c *cloudStorageFS) Create(ctx context.Context, path string, options *WriterOptions) (io.WriteCloser, error) {
	b, err := c.bucketHandle(ctx, ScopeWrite)
	if err != nil {
		return nil, err
	}

	w := b.Object(path).NewWriter(ctx)

	if options != nil {
		w.Metadata = options.Attributes.Metadata
		w.ContentType = options.Attributes.ContentType
		w.ContentEncoding = options.Attributes.ContentEncoding
		w.ChunkSize = options.BufferSize
	}
	w.ChunkSize = c.chunkSize(w.ChunkSize)

	return w, nil
}

func (c *cloudStorageFS) chunkSize(size int) int {
	if size == 0 {
		return googleapi.DefaultUploadChunkSize
	} else if size > 0 {
		return size
	}

	return 0 // disable buffering
}

// Delete implements FS.
func (c *cloudStorageFS) Delete(ctx context.Context, path string) error {
	b, err := c.bucketHandle(ctx, ScopeDelete)
	if err != nil {
		return err
	}

	return b.Object(path).Delete(ctx)
}

// Walk implements FS.
func (c *cloudStorageFS) Walk(ctx context.Context, path string, fn WalkFn) error {
	bh, err := c.bucketHandle(ctx, ScopeRead)
	if err != nil {
		return err
	}

	it := bh.Objects(ctx, &gstorage.Query{
		Prefix: path,
	})

	for {
		r, err := it.Next()
		if errors.Is(err, iterator.Done) {
			break
		}
		if err != nil {
			// TODO(dhowden): Properly handle this error.
			return err
		}

		if err = fn(r.Name); err != nil {
			return err
		}
	}

	return nil
}

func cloudStorageScope(scope Scope) string {
	switch {
	case scope.Has(ScopeDelete):
		return gstorage.ScopeFullControl
	case scope.Has(ScopeWrite):
		return gstorage.ScopeReadWrite
	case scope.Has(ScopeRead), scope.Has(ScopeSignURL):
		return gstorage.ScopeReadOnly
	default:
		panic(fmt.Sprintf("unknown scope: '%s'", scope))
	}
}

func ResolveCloudStorageScope(scope Scope) Scope {
	switch cloudStorageScope(scope) {
	case gstorage.ScopeFullControl:
		return ScopeRWD | scope
	case gstorage.ScopeReadWrite:
		return ScopeRW | scope
	case gstorage.ScopeReadOnly:
		return ScopeRead | scope
	default:
		panic(fmt.Sprintf("unknown scope: '%s'", scope))
	}
}

func (c *cloudStorageFS) findCredentials(ctx context.Context, scope string) (*google.Credentials, error) {
	if c.credentials != nil {
		return c.credentials, nil
	}

	return google.FindDefaultCredentials(ctx, scope)
}

func (c *cloudStorageFS) client(ctx context.Context, scope Scope) (*gstorage.Client, error) {
	creds, err := c.findCredentials(ctx, cloudStorageScope(scope))
	if err != nil {
		return nil, fmt.Errorf("finding credentials: %w", err)
	}

	var options []option.ClientOption
	options = append(options, option.WithCredentials(creds))
	options = append(options, option.WithScopes(cloudStorageScope(scope)))

	client, err := gstorage.NewClient(ctx, options...)
	if err != nil {
		return nil, fmt.Errorf("building client: %w", err)
	}

	return client, nil
}

func (c *cloudStorageFS) bucketHandle(ctx context.Context, scope Scope) (*gstorage.BucketHandle, error) {
	c.bucketLock.RLock()
	scope |= c.bucketScopes // Expand requested scope to encompass existing scopes
	if bucket := c.bucket; bucket != nil && c.bucketScopes.Has(scope) {
		c.bucketLock.RUnlock()

		return bucket, nil
	}
	c.bucketLock.RUnlock()

	c.bucketLock.Lock()
	defer c.bucketLock.Unlock()
	if c.bucket != nil && c.bucketScopes.Has(scope) { // Race condition
		return c.bucket, nil
	}

	// Expand the requested scope to include the scopes that GCS would provide
	// e.g. Requesting Write actually provides ReadWrite.
	// Also include any scope that was previously used.
	scope = ResolveCloudStorageScope(c.bucketScopes | scope)

	client, err := c.client(ctx, scope)
	if err != nil {
		return nil, err
	}

	c.bucket = client.Bucket(c.bucketName)
	c.bucketScopes = scope

	return c.bucket, nil
}
