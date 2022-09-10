// Package storage provides types and functionality for abstracting storage systems
// (local, in memory, Google Cloud storage) into a common interface.
package storage

import (
	"context"
	"io"
	"time"
)

// File contains the metadata required to define a file (for reading).
type File struct {
	io.ReadCloser // Underlying data.
	Attributes
}

// Attributes represents the metadata of a File
// Inspired from gocloud.dev/blob.Attributes
type Attributes struct {
	// ContentType is the MIME type of the blob object. It will not be empty.
	ContentType string
	// ContentEncoding specifies the encoding used for the blob's content, if any.
	ContentEncoding string
	// Metadata holds key/value pairs associated with the blob.
	// Keys are guaranteed to be in lowercase, even if the backend provider
	// has case-sensitive keys (although note that Metadata written via
	// this package will always be lowercased). If there are duplicate
	// case-insensitive keys (e.g., "foo" and "FOO"), only one value
	// will be kept, and it is undefined which one.
	Metadata map[string]string
	// ModTime is the time the blob object was last modified.
	ModTime time.Time
	// CreationTime is the time the blob object was created.
	CreationTime time.Time
	// Size is the size of the object in bytes.
	Size int64
}

// ReaderOptions are used to modify the behaviour of read operations.
// Inspired from gocloud.dev/blob.ReaderOptions
// It is provided for future extensibility.
type ReaderOptions struct {
	// ReadCompressed controls whether the file must be uncompressed based on Content-Encoding.
	// Only respected by Google Cloud Storage: https://cloud.google.com/storage/docs/transcoding
	// Common pitfall: https://github.com/googleapis/google-cloud-go/issues/1743
	ReadCompressed bool
}

// WriterOptions are used to modify the behaviour of write operations.
// Inspired from gocloud.dev/blob.WriterOptions
// Not all options are supported by all FS
type WriterOptions struct {
	Attributes Attributes

	// BufferSize changes the default size in bytes of the chunks that
	// Writer will upload in a single request; larger blobs will be split into
	// multiple requests.
	//
	// This option may be ignored by some drivers.
	//
	// If 0, the driver will choose a reasonable default.
	//
	// If the Writer is used to do many small writes concurrently, using a
	// smaller BufferSize may reduce memory usage.
	BufferSize int
}

// DefaultSignedURLExpiry is the default duration for SignedURLOptions.Expiry.
const (
	DefaultSignedURLExpiry = 1 * time.Hour
	DefaultSignedURLMethod = "GET"
)

// SignedURLOptions are used to modify the behaviour of write operations.
// Inspired from gocloud.dev/blob.SignedURLOptions
// Not all options are supported by all FS
type SignedURLOptions struct {
	// Expiry sets how long the returned URL is valid for.
	// Defaults to DefaultSignedURLExpiry.
	Expiry time.Duration
	// Method is the HTTP method that can be used on the URL; one of "GET", "PUT",
	// or "DELETE". Defaults to "GET".
	Method string
}

func (o *SignedURLOptions) applyDefaults() {
	if o.Expiry == 0 {
		o.Expiry = DefaultSignedURLExpiry
	}
	if o.Method == "" {
		o.Method = DefaultSignedURLMethod
	}
}

// FS is an interface which defines a virtual filesystem.
type FS interface {
	Walker

	// Open opens an existing file at path in the filesystem.  Callers must close the
	// File when done to release all underlying resources.
	Open(ctx context.Context, path string, options *ReaderOptions) (*File, error)

	// Attributes returns attributes about a path
	Attributes(ctx context.Context, path string, options *ReaderOptions) (*Attributes, error)

	// Create makes a new file at path in the filesystem.  Callers must close the
	// returned WriteCloser and check the error to be sure that the file
	// was successfully written.
	Create(ctx context.Context, path string, options *WriterOptions) (io.WriteCloser, error)

	// Delete removes a path from the filesystem.
	Delete(ctx context.Context, path string) error

	// URL resolves a path to an addressable URL
	URL(ctx context.Context, path string, options *SignedURLOptions) (string, error)
}
