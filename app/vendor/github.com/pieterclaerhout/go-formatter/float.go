package formatter

import (
	"fmt"
)

// FloatWithPrecision formats a float with a custom precision
func FloatWithPrecision(value float64, precision int64) string {
	return fmt.Sprintf("%."+fmt.Sprintf("%d", precision)+"f", value)
}
