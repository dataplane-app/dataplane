package formatter

import (
	"fmt"
	"math"
)

const (
	// BYTE defines a filesize of 1 byte
	BYTE = 1.0

	// KILOBYTE defines a filesize of 1 kilobyte
	KILOBYTE = 1000 * BYTE

	// MEGABYTE defines a filesize of 1 megabyte
	MEGABYTE = 1000 * KILOBYTE

	// GIGABYTE defines a filesize of 1 gigabyte
	GIGABYTE = 1000 * MEGABYTE

	// TERABYTE defines a filesize of 1 terabyte
	TERABYTE = 1000 * GIGABYTE
)

// FileSize formats the filesize as a string with a precision of 2 decimals
func FileSize(bytes int64) string {
	return FileSizeWithPrecision(bytes, 2)
}

// FileSizeWithPrecision formats the filesize as a string with a custom precision
func FileSizeWithPrecision(bytes int64, precision int64) string {
	unit := ""
	value := float64(bytes)
	absValue := math.Abs(value)

	switch {
	case absValue >= TERABYTE:
		unit = "TB"
		value = value / TERABYTE
	case absValue >= GIGABYTE:
		unit = "GB"
		value = value / GIGABYTE
	case absValue >= MEGABYTE:
		unit = "MB"
		value = value / MEGABYTE
	case absValue >= KILOBYTE:
		unit = "KB"
		value = value / KILOBYTE
	case absValue >= BYTE:
		return fmt.Sprintf("%.0f bytes", value)
	case absValue == 0:
		return "0 bytes"
	}

	stringValue := fmt.Sprintf("%."+fmt.Sprintf("%d", precision)+"f", value)
	return fmt.Sprintf("%s %s", stringValue, unit)

}
