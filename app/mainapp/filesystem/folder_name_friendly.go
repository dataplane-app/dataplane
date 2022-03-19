package filesystem

import (
	"regexp"
	"strings"
)

func FolderFriendly(str string) string {

	str = strings.ReplaceAll(str, " ", "_")
	var re = regexp.MustCompile(`(?m)[^\w]`)

	var substitution = ""

	return re.ReplaceAllString(str, substitution)
}
