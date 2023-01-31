package formatter

import (
	"fmt"
	"math"
)

// Elapsed forrmats a duration in HH:MM:SS showing empty if the duration is less or equal than 0
func Elapsed(duration int64, empty string) string {

	if duration <= 0 {
		return empty
	}

	durationAsFloat := float64(duration)

	hours := math.Floor(durationAsFloat / 3600.0)
	minutes := math.Floor((durationAsFloat - (hours * 3600.0)) / 60)
	seconds := duration % 60

	return fmt.Sprintf("%02.0f:%02.0f:%02d", hours, minutes, seconds)

}
