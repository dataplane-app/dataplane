# Storage

storage is a Go package which abstracts file systems (local, in-memory, Google Cloud Storage) into a few interfaces.  It includes convenience wrappers for simplifying common file system use cases such as caching, prefix isolation and more!

Forked from https://github.com/sajari/storage

# Requirements

- [Go 1.10+](http://golang.org/dl/)

# Installation

```console
$ go get github.com/Shopify/go-storage
```

# Usage

All storage in this package follow two simple interfaces designed for using file systems.

```go
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

// WalkFn is a function type which is passed to Walk.
type WalkFn func(path string) error

// Walker is an interface which defines the Walk method.
type Walker interface {
	// Walk traverses a path listing by prefix, calling fn with each object path rewritten
	// to be relative to the underlying filesystem and provided path.
	Walk(ctx context.Context, path string, fn WalkFn) error
}
```

## Local

Local is the default implementation of a local file system (i.e. using `os.Open` etc).

```go
local := storage.NewLocalFS("/some/root/path")
f, err := local.Open(context.Background(), "file.json", nil) // will open "/some/root/path/file.json"
if err != nil {
	// ...
}
// ...
f.Close()
```

## Memory

Mem is the default in-memory implementation of a file system.

```go
mem := storage.NewMemoryFS()
wc, err := mem.Create(context.Background(), "file.txt", nil)
if err != nil {
	// ...
}
if _, err := io.WriteString(wc, "Hello World!"); err != nil {
	// ...
}
if err := wc.Close(); err != nil {
	// ...
}
```

And now:

```go
f, err := mem.Open(context.Background(), "file.txt", nil)
if err != nil {
	// ...
}
// ...
f.Close()
```

## Google Cloud Storage

CloudStorage is the default implementation of Google Cloud Storage.  This uses [https://godoc.org/golang.org/x/oauth2/google#DefaultTokenSource](`google.DefaultTokenSource`) for autentication.

```go
store := storage.NewCloudStorageFS("some-bucket")
f, err := store.Open(context.Background(), "file.json", nil) // will fetch "gs://some-bucket/file.json"
if err != nil {
	// ...
}
// ...
f.Close()
```

## Wrappers and Helpers

### Simple Caching

To use Cloud Storage as a source file system, but cache all opened files in a local filesystem:

```go
src := storage.NewCloudStorageFS("some-bucket")
local := storage.NewLocalFS("/scratch-space")

fs := storage.NewCacheWrapper(src, local)
f, err := fs.Open(context.Background(), "file.json", nil) // will try src then jump to cache ("gs://some-bucket/file.json")
if err != nil {
	// ...
}
// ...
f.Close()

f, err := fs.Open(context.Background(), "file.json", nil) // should now be cached ("/scratch-space/file.json")
if err != nil {
	// ...
}
// ...
f.Close()
```

This is particularly useful when distributing files across multiple regions or between cloud providers.  For instance, we could add the following code to the previous example:

```go
mainSrc := storage.NewCloudStorage("some-bucket-in-another-region")
fs2 := storage.NewCacheWrapper(mainSrc, fs) // fs is from previous snippet

// Open will:
// 1. Try local (see above)
// 2. Try gs://some-bucket
// 3. Try gs://some-bucket-in-another-region, which will be cached in gs://some-bucket and then local on its
//    way back to the caller.
f, err := fs2.Open(context.Background(), "file.json", nil) // will fetch "gs://some-bucket-in-another-region/file.json"
if err != nil {
	// ...
}
// ...
f.Close()

f, err := fs2.Open(context.Background(), "file.json", nil) // will fetch "/scratch-space/file.json"
if err != nil {
	// ...
}
// ...
f.Close()
```

### Adding prefixes to paths

If you're writing code that relies on a set directory structure, it can be very messy to have to pass path-patterns around.  You can avoid this by wrapping `storage.FS` implementations with `storage.Prefix` that rewrites all incoming paths.

```go
modelFS := storage.NewPrefixWrapper(rootFS, "models/")
f, err := modelFS.Open(context.Background(), "file.json", nil) // will call rootFS.Open with path "models/file.json"
if err != nil {
	// ...
}
// ...
f.Close()
```

It's also now simple to write wrapper functions to abstract out more complex directory structures.

```go
func NewUserFS(fs storage.FS, userID, mediaType string) FS {
	return storage.NewPrefixWrapper(fs, fmt.Sprintf("%v/%v", userID, userType))
}

userFS := NewUserFS(rootFS, "1111", "pics")
f, err := userFS.Open(context.Background(), "beach.png", nil) // will call rootFS.Open with path "1111/pics/beach.png"
if err != nil {
	// ...
}
// ...
f.Close()
```
