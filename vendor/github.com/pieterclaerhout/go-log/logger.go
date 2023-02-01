package log

import (
	"fmt"
	"io"
	"os"
	"strings"
	"time"

	"github.com/pkg/errors"
	"github.com/rotisserie/eris"
	"github.com/sanity-io/litter"
)

// PrintTimestamp indicates if the log messages should include a timestamp or not
var PrintTimestamp = false

// PrintColors indicates if the messages should be printed in color or not
var PrintColors = false

// DebugMode indicates if debug information should be printed or not
//
// If the environment variable called DEBUG is set to 1, this will default to true.
// In all other cases, debug mode is false by default.
var DebugMode = false

// TimeZone indicates in which timezone the time should be formatted
var TimeZone *time.Location

// Stdout is the writer to where the stdout messages should be written (defaults to os.Stdout)
var Stdout io.Writer = os.Stdout

// Stderr is the writer to where the stderr messages should be written (defaults to os.Stderr)
var Stderr io.Writer = os.Stderr

// DefaultTimeFormat is the default format to use for the timestamps
var DefaultTimeFormat = "2006-01-02 15:04:05.000"

// TestingTimeFormat is the format to use for the timestamps during testing
var TestingTimeFormat = "test"

// TimeFormat is the format to use for the timestamps
var TimeFormat = DefaultTimeFormat

// OsExit is the function to exit the app when a fatal error happens
var OsExit = os.Exit

// Debug prints a debug message
//
// Only shown if DebugMode is set to true
func Debug(args ...interface{}) {
	if DebugMode {
		message := formatMessage(args...)
		printMessage("DEBUG", message)
	}
}

// Debugf prints a debug message with a format and arguments
//
// Only shown if DebugMode is set to true
func Debugf(format string, args ...interface{}) {
	if DebugMode {
		msg := fmt.Sprintf(format, args...)
		Debug(msg)
	}
}

// DebugSeparator prints a debug separator
//
// Only shown if DebugMode is set to true
func DebugSeparator(args ...interface{}) {
	if DebugMode {
		message := formatMessage(args...)
		message = formatSeparator(message, "=", 80)
		printMessage("DEBUG", message)
	}
}

// DebugDump dumps the argument as a debug message with an optional prefix
func DebugDump(arg interface{}, prefix string) {
	message := litter.Sdump(arg)
	if prefix != "" {
		Debug(prefix, message)
	} else {
		Debug(message)
	}
}

// Info prints an info message
func Info(args ...interface{}) {
	message := formatMessage(args...)
	printMessage("INFO ", message)
}

// Infof prints an info message with a format and arguments
func Infof(format string, args ...interface{}) {
	msg := fmt.Sprintf(format, args...)
	Info(msg)
}

// InfoSeparator prints an info separator
func InfoSeparator(args ...interface{}) {
	message := formatMessage(args...)
	message = formatSeparator(message, "=", 80)
	printMessage("INFO ", message)
}

// InfoDump dumps the argument as an info message with an optional prefix
func InfoDump(arg interface{}, prefix string) {
	message := litter.Sdump(arg)
	if prefix != "" {
		Info(prefix, message)
	} else {
		Info(message)
	}
}

// Warn prints an warning message
func Warn(args ...interface{}) {
	message := formatMessage(args...)
	printMessage("WARN ", message)
}

// Warnf prints a warning message with a format and arguments
func Warnf(format string, args ...interface{}) {
	msg := fmt.Sprintf(format, args...)
	Warn(msg)
}

// WarnSeparator prints a warning separator
func WarnSeparator(args ...interface{}) {
	message := formatMessage(args...)
	message = formatSeparator(message, "=", 80)
	printMessage("WARN ", message)
}

// WarnDump dumps the argument as a warning message with an optional prefix
func WarnDump(arg interface{}, prefix string) {
	message := litter.Sdump(arg)
	if prefix != "" {
		Warn(prefix, message)
	} else {
		Warn(message)
	}
}

// Error prints an error message to stderr
func Error(args ...interface{}) {
	message := formatMessage(args...)
	printMessage("ERROR", message)
}

// Errorf prints an error message with a format and arguments
func Errorf(format string, args ...interface{}) {
	msg := fmt.Sprintf(format, args...)
	Error(msg)
}

// ErrorSeparator prints an error separator
func ErrorSeparator(args ...interface{}) {
	message := formatMessage(args...)
	message = formatSeparator(message, "=", 80)
	printMessage("ERROR", message)
}

// ErrorDump dumps the argument as an err message with an optional prefix to stderr
func ErrorDump(arg interface{}, prefix string) {
	message := litter.Sdump(arg)
	if prefix != "" {
		Error(prefix, message)
	} else {
		Error(message)
	}
}

// StackTrace prints an error message with the stacktrace of err to stderr
func StackTrace(err error) {
	message := formatMessage(FormattedStackTrace(err))
	printMessage("ERROR", message)
}

// FormattedStackTrace returns a formatted stacktrace for err
func FormattedStackTrace(err error) string {

	if cause := errors.Cause(err); cause != nil {
		err = cause
	}

	result := eris.ToCustomString(eris.Wrap(err, err.Error()), eris.NewDefaultStringFormat(eris.FormatOptions{
		WithTrace:    true,
		WithExternal: false,
		InvertTrace:  true,
	}))

	resultLines := strings.Split(result, "\n")

	result = ""
	for idx, line := range resultLines {
		if strings.Contains(line, "go-log.") {
			continue
		}
		if idx == 0 {
			result += fmt.Sprintf("%s\n", line)
			continue
		}
		lineParts := strings.SplitN(line, ":", 2)
		if len(lineParts) == 2 {
			result += fmt.Sprintf("%-50s %s\n", lineParts[0], lineParts[1])
		}
	}

	return strings.TrimSuffix(result, "\n")

}

// Fatal logs a fatal error message to stdout and exits the program with exit code 1
func Fatal(args ...interface{}) {
	message := formatMessage(args...)
	printMessage("FATAL", message)
	OsExit(1)
}

// Fatalf prints a fatal message with a format and arguments
func Fatalf(format string, args ...interface{}) {
	msg := fmt.Sprintf(format, args...)
	Fatal(msg)
}

// CheckError checks if the error is not nil and if that's the case, it will print a fatal message and exits the
// program with exit code 1.
//
// If DebugMode is enabled a stack trace will also be printed to stderr
func CheckError(err error) {

	if err == nil {
		return
	}

	msg := err.Error()
	if DebugMode {
		msg = formatMessage(FormattedStackTrace(err))
	}

	printMessage("FATAL", msg)

	OsExit(1)

}
