package storage

import (
	"context"
	"io"

	"github.com/stretchr/testify/mock"
)

// NewMockFS creates an FS where each method can be mocked.
// To be used in tests.
func NewMockFS() *MockFS {
	return &MockFS{}
}

type MockFS struct {
	mock.Mock
}

func (m *MockFS) Walk(ctx context.Context, path string, fn WalkFn) error {
	args := m.Called(ctx, path, fn)

	return args.Error(0)
}

func (m *MockFS) Open(ctx context.Context, path string, options *ReaderOptions) (*File, error) {
	args := m.Called(ctx, path, options)
	file := args.Get(0)
	err := args.Error(1)
	if file == nil {
		return nil, err
	}

	return file.(*File), err
}

func (m *MockFS) Attributes(ctx context.Context, path string, options *ReaderOptions) (*Attributes, error) {
	args := m.Called(ctx, path, options)
	attrs := args.Get(0)
	err := args.Error(1)
	if attrs == nil {
		return nil, err
	}

	return attrs.(*Attributes), err
}

func (m *MockFS) Create(ctx context.Context, path string, options *WriterOptions) (io.WriteCloser, error) {
	args := m.Called(ctx, path, options)
	w := args.Get(0)
	err := args.Error(1)
	if w == nil {
		return nil, err
	}

	return w.(io.WriteCloser), err
}

func (m *MockFS) Delete(ctx context.Context, path string) error {
	args := m.Called(ctx, path)

	return args.Error(0)
}

func (m *MockFS) URL(ctx context.Context, path string, options *SignedURLOptions) (string, error) {
	args := m.Called(ctx, path, options)
	url := args.String(0)
	err := args.Error(1)

	return url, err
}
