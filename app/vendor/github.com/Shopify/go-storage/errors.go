package storage

import (
	"errors"
	"fmt"
)

var ErrNotImplemented = errors.New("not implemented")

// isNotExister is an interface used to define the behaviour of errors resulting
// from operations which report missing files/paths.
type isNotExister interface {
	isNotExist() bool
}

// IsNotExist returns a boolean indicating whether the error is known to report that
// a path does not exist.
func IsNotExist(err error) bool {
	var e isNotExister
	if err != nil && errors.As(err, &e) {
		return e.isNotExist()
	}

	return false
}

// notExistError is returned from FS.Open implementations when a requested
// path does not exist.
type notExistError struct {
	Path string
}

func (e *notExistError) isNotExist() bool { return true }

// Error implements error
func (e *notExistError) Error() string {
	return fmt.Sprintf("storage %v: path does not exist", e.Path)
}
