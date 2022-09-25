package formatter

import (
	"golang.org/x/text/language"
	"golang.org/x/text/message"
)

// IntWithSeparators formats an integer with separators using the language Dutch
func IntWithSeparators(number int64) string {
	p := message.NewPrinter(language.Dutch)
	return p.Sprintf("%d", number)
}
