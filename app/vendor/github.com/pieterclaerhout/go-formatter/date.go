package formatter

import (
	"fmt"
	"time"
)

// UnixTimestamp formats a unix timestamp with the given layout
func UnixTimestamp(sec int64, layout string) string {
	return time.Unix(sec, 0).Format(layout)
}

// DurationInMilliseconds formats a duration as milliseconds (including the suffix "ms")
func DurationInMilliseconds(d time.Duration) string {
	return fmt.Sprintf("%.0fms", d.Seconds()*1e3)
}
