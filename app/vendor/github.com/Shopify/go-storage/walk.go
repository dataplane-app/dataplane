package storage

import (
	"context"
	"sync"
)

// WalkFn is a function type which is passed to Walk.
type WalkFn func(path string) error

// Walker is an interface which defines the Walk method.
type Walker interface {
	// Walk traverses a path listing by prefix, calling fn with each path.
	Walk(ctx context.Context, path string, fn WalkFn) error
}

// List runs the Walker on the given path and returns the list of visited paths.
func List(ctx context.Context, w Walker, path string) ([]string, error) {
	var out []string
	if err := w.Walk(ctx, path, func(path string) error {
		out = append(out, path)

		return nil
	}); err != nil {
		return nil, err
	}

	return out, nil
}

// WalkN creates n workers which accept paths from the Walker.  If a WalkFn
// returns non-nil error we wait for other running WalkFns to finish before
// returning.
func WalkN(ctx context.Context, w Walker, path string, n int, fn WalkFn) error {
	errCh := make(chan error, n)
	ch := make(chan string)
	wg := sync.WaitGroup{}

	for i := 0; i < n; i++ {
		wg.Add(1)
		go func() {
			for f := range ch {
				if err := fn(f); err != nil {
					errCh <- err

					break
				}
			}
			wg.Done()
		}()
	}

	err := w.Walk(ctx, path, func(path string) error {
		select {
		case err := <-errCh:
			return err
		case ch <- path:
			return nil
		}
	})

	close(ch)
	wg.Wait()
	close(errCh)

	return err
}
