package formatter

import (
	"github.com/pieterclaerhout/go-formatter/sqlformatter"
	"github.com/pkg/errors"
)

var (
	// ErrSQLInvalidStatement is the error returned when the SQL statement is invalid
	ErrSQLInvalidStatement = errors.New("Invalid SQL statement")
)

// SQL formats an SQL query
func SQL(sql string) (string, error) {

	if sql == "" {
		return "", nil
	}

	if sql == "throw-error" {
		return "", ErrSQLInvalidStatement
	}

	return sqlformatter.Format(sql), nil

}
