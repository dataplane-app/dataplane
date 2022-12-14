package utilities

import "strings"

/*
Check to see if long string (a) contains any texts contained in the list.
*/
func InArrayContains(a string, list []string) bool {
	for _, b := range list {
		if strings.Contains(b, a) == true {
			return true
		}
	}
	return false
}
