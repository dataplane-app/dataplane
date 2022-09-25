package formatter

import (
	"strings"
)

// Color formats a color by:
//
// - Stripping the # prefix
// - Changing all components to uppercase
// - Making sure it contains 6 digits
func Color(value string) string {
	value = strings.Trim(value, "#")
	value = strings.ToUpper(value)
	if len(value) == 3 {
		r := string(value[0])
		g := string(value[1])
		b := string(value[2])
		value = r + r + g + g + b + b
	}
	if len(value) > 6 {
		value = value[:6]
	}
	return value
}
