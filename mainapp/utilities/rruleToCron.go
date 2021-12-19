package utilities

import (
	"errors"
	"fmt"
	"strconv"
	"strings"
)

// Takes rrule string returns cron string
// RRULE:FREQ=MONTHLY;INTERVAL=1;BYDAY=MO   =>   0 0 0 ? * 1 *
func Rtoc(rule string) (string, error) {

	var C_DAYS_OF_WEEK_RRULE = []string{"MO", "TU", "WE", "TH", "FR", "SA", "SU"}
	var C_DAYS_WEEKDAYS_RRULE = []string{"MO", "TU", "WE", "TH", "FR"}
	var C_DAYS_OF_WEEK_CRONE = []string{"1", "2", "3", "4", "5", "6", "7"}
	var C_DAYS_OF_WEEK_CRONE_NAMED = []string{
		"MON",
		"TUE",
		"WED",
		"THU",
		"FRI",
		"SAT",
		"SUN",
	}
	var C_MONTHS = []string{
		"JAN",
		"FEB",
		"MAR",
		"APR",
		"MAY",
		"JUN",
		"JUL",
		"AUG",
		"SEP",
		"OCT",
		"NOV",
		"DEC",
	}

	var result string = ""
	var dayOfMonth string = "?"
	var month string = "*"
	var dayOfWeek string = "?"
	// var year string = "*"
	var FREQ string = ""
	var INTERVAL int = -1
	var BYMONTHDAY int = -1
	var BYMONTH int = -1
	var BYDAY string = ""
	// var WKST string = ""
	var BYSETPOS int = 0
	var BYHOUR int = 0
	var BYMINUTE int = 0
	var BYSECOND int = 0
	var arrByDayRRule []string

	rarr := strings.Split(rule, ";")

	// Extract param,value pairs
	for _, e := range rarr {
		param := strings.Split(e, "=")[0]
		value := strings.Split(e, "=")[1]

		if param == "FREQ" {
			FREQ = value
		}
		if param == "INTERVAL" {
			interval, _ := strconv.Atoi(value)
			INTERVAL = interval
		}
		if param == "BYMONTHDAY" {
			byMonthDay, _ := strconv.Atoi(value)
			BYMONTHDAY = byMonthDay
		}
		if param == "BYDAY" {
			BYDAY = value
			arrByDayRRule = strings.Split(BYDAY, ",")
		}
		// if param == "WKST" {
		// 	WKST = value
		// 	if BYDAY == "" {
		// 		BYDAY = value
		// 	}
		// }
		if param == "BYSETPOS" {
			bySetPos, _ := strconv.Atoi(value)
			BYSETPOS = bySetPos
		}
		if param == "BYMONTH" {
			byMonth, _ := strconv.Atoi(value)
			BYMONTH = byMonth
		}
		if param == "BYHOUR" {
			byHour, _ := strconv.Atoi(value)
			BYHOUR = byHour
		}
		if param == "BYMINUTE" {
			byMinute, _ := strconv.Atoi(value)
			BYMINUTE = byMinute
		}
		if param == "BYSECOND" {
			bySecond, _ := strconv.Atoi(value)
			BYSECOND = bySecond
		}
	}

	// Monthly recurrence
	if FREQ == "MONTHLY" {
		if INTERVAL == 1 {
			//String to satisfy this condition => "FREQ=MONTHLY;INTERVAL=1;BYMONTHDAY=1"
			month = "*" // every month
		} else {
			//String to satisfy this condition => "FREQ=MONTHLY;INTERVAL=2;BYMONTHDAY=1"
			month = "1/" + fmt.Sprint(INTERVAL) // 1 - start of january, every INTERVALth month
		}

		// If it isn't the last day of the month
		if BYMONTHDAY != -1 {
			//String to satisfy this condition => "FREQ=MONTHLY;INTERVAL=1;BYMONTHDAY=1"
			dayOfMonth = fmt.Sprint(BYMONTHDAY)

			// If last day of the month
		} else if BYSETPOS != 0 {
			if BYDAY == "" {
				//String to satisfy this condition => "FREQ=MONTHLY;INTERVAL=1;BYMONTHDAY=-1"
				return "", errors.New("no BYDAY specified for MONTHLY/BYSETPOS rule")
			}
			if BYDAY == "MO,TU,WE,TH,FR" {
				// First weekday of every month
				if BYSETPOS == 1 {
					// String to satisfy this condition => "FREQ=MONTHLY;INTERVAL=1;BYSETPOS=1;BYDAY=MO,TU,WE,TH,FR"
					dayOfMonth = "1W"

					// Last weekday of every month
				} else if BYSETPOS == -1 {
					// String to satisfy this condition => "FREQ=MONTHLY;INTERVAL=1;BYSETPOS=-1;BYDAY=MO,TU,WE,TH,FR"
					dayOfMonth = "LW"

					// Any day other than first and last of every month
				} else {
					// String to satisfy this condition => "FREQ=MONTHLY;INTERVAL=1;BYSETPOS=5;BYDAY=MO,TU,WE,TH,FR"
					return "", errors.New("unsupported Xth weekday for MONTHLY rule (only 1st and last weekday are supported)")
				}

				// Not every day of the week or a single day (2-6 days a week)
			} else if IndexOf(C_DAYS_OF_WEEK_RRULE, BYDAY) == -1 {
				// String to satisfy this condition => "FREQ=MONTHLY;INTERVAL=1;BYSETPOS=5;BYDAY=MO,TU,WE"
				return "", errors.New("Unsupported BYDAY rule (multiple days are not supported by crone): " + BYDAY)

			} else {
				dayOfMonth = "?"

				// Positive nth occurance
				if BYSETPOS > 0 {
					// String to satisfy this condition => "FREQ=MONTHLY;INTERVAL=1;BYDAY=FR;BYSETPOS=3"
					// 3rd friday 6#3
					dayOfWeek =
						C_DAYS_OF_WEEK_CRONE[IndexOf(C_DAYS_OF_WEEK_RRULE, BYDAY)] +
							"#" +
							fmt.Sprint(BYSETPOS)

					// last specific day of the month
				} else if BYSETPOS == -1 {
					// String to satisfy this condition => "FREQ=MONTHLY;INTERVAL=1;BYDAY=FR;BYSETPOS=-1"
					dayOfWeek =
						C_DAYS_OF_WEEK_CRONE[IndexOf(C_DAYS_OF_WEEK_RRULE, BYDAY)] + "L"

					// If BYSETPOS < -1
				} else {
					// String to satisfy this condition => "FREQ=MONTHLY;INTERVAL=1;BYDAY=FR;BYSETPOS=-2"
					return "", errors.New("unsupported last Nth occourance of day of MONTHLY rrule (only last occourance of a day)")
				}
			}
		} else if BYDAY != "" {
			// String to satisfy this condition => "FREQ=MONTHLY;INTERVAL=1;BYDAY=FR"
			dayOfWeek = C_DAYS_OF_WEEK_CRONE[IndexOf(C_DAYS_OF_WEEK_RRULE, BYDAY)]
		} else {
			return "", errors.New("no BYMONTHDAY or BYSETPOS in MONTHLY rrule")

		}
	}

	if FREQ == "WEEKLY" {
		if INTERVAL != 1 {
			// String to satisfy this condition => "FREQ=WEEKLY;INTERVAL=2;BYDAY=FR"
			return "", errors.New("every Nth week other than 1st is not supported")
		}

		// Every day of the week
		if sameStringSlice(C_DAYS_OF_WEEK_RRULE, arrByDayRRule) {
			// String to satisfy this condition => "FREQ=WEEKLY;INTERVAL=1;BYDAY=MO,TU,WE,TH,FR,SA,SU"
			dayOfWeek = "*" // all days of week

			// Specified days of the week
		} else {
			// String to satisfy this condition => "FREQ=WEEKLY;INTERVAL=1;BYDAY=MO,TU,WE"
			var arrByDayCron []string
			for i := range arrByDayRRule {
				indexOfDayOfWeek := IndexOf(C_DAYS_OF_WEEK_RRULE, arrByDayRRule[i])
				arrByDayCron = append(arrByDayCron, C_DAYS_OF_WEEK_CRONE_NAMED[indexOfDayOfWeek])
			}
			dayOfWeek = strings.Join(arrByDayCron, ",")
		}
	}
	if FREQ == "DAILY" {
		if INTERVAL != 1 {
			// String to satisfy this condition => "FREQ=DAILY;INTERVAL=5"
			dayOfMonth = "1/" + fmt.Sprint(INTERVAL)
		}
	}

	if FREQ == "YEARLY" {
		if BYMONTH == -1 {
			// String to satisfy this condition => "FREQ=YEARLY;INTERVAL=1"
			return "", errors.New("missing BYMONTH in YEARLY rule")
		}
		month = C_MONTHS[BYMONTH-1]
		if BYMONTHDAY != -1 {
			// 2nd day of March
			// String to satisfy this condition => "FREQ=YEARLY;INTERVAL=1;BYMONTH=3;BYMONTHDAY=2"
			dayOfMonth = fmt.Sprint(BYMONTHDAY)
		} else {
			if BYSETPOS == -1 {
				// Check if every day of the week is selected
				if sameStringSlice(C_DAYS_OF_WEEK_RRULE, arrByDayRRule) {
					// String to satisfy this condition => "FREQ=YEARLY;INTERVAL=1;BYDAY=MO,TU,WE,TH,FR,SA,SU;BYMONTH=1;BYSETPOS=-1"
					dayOfMonth = "L"

					// Check if only weekdays is selected
				} else if sameStringSlice(C_DAYS_WEEKDAYS_RRULE, arrByDayRRule) {
					// String to satisfy this condition => "FREQ=YEARLY;INTERVAL=1;BYDAY=MO,TU,WE,TH,FR;BYMONTH=1;BYSETPOS=-1"
					dayOfMonth = "LW"
				} else {
					// String to satisfy this condition => "FREQ=YEARLY;INTERVAL=1;BYDAY=MO,TU,WE;BYMONTH=1;BYSETPOS=-1"
					return "", errors.New("last weekends and just last specific days of Month are not supported")
				}
			} else {
				if sameStringSlice(C_DAYS_WEEKDAYS_RRULE, arrByDayRRule) && BYSETPOS == 1 {
					// String to satisfy this condition => "FREQ=YEARLY;INTERVAL=1;BYDAY=MO,TU,WE,TH,FR;BYMONTH=1;BYSETPOS=1"
					dayOfMonth = fmt.Sprint(BYSETPOS) + "W"
				} else if len(arrByDayRRule) == 1 {
					// String to satisfy this condition => "FREQ=YEARLY;INTERVAL=1;BYDAY=MO;BYMONTH=1;BYSETPOS=1"
					dayOfWeek =
						C_DAYS_OF_WEEK_CRONE[IndexOf(C_DAYS_OF_WEEK_RRULE, BYDAY)] +
							"#" +
							fmt.Sprint(BYSETPOS)
				} else {
					// String to satisfy this condition => "FREQ=YEARLY;INTERVAL=1;BYDAY=MO,TU;BYMONTH=1;BYSETPOS=1"

					return "", errors.New("multiple days are not supported in YEARLY rule")

				}
			}
		}
	}

	result = fmt.Sprint(BYSECOND) +
		" " + fmt.Sprint(BYMINUTE) +
		" " + fmt.Sprint(BYHOUR) +
		" " + dayOfMonth +
		" " + month +
		" " + dayOfWeek
	// " " + year

	return result, nil
}

///////////////////////////////////////////////////////////////////////
//                      Utility functions                            //
///////////////////////////////////////////////////////////////////////

// IndexOf returns the first index of needle in haystack
// or -1 if needle is not in haystack.
func IndexOf(haystack []string, needle string) int {
	for i, v := range haystack {
		if v == needle {
			return i
		}
	}
	return -1
}

// Check for equality in 2 slices without order [https://stackoverflow.com/a/36000696]
// [a, b, a] == [a, a, b] ==> True
// [a, b, a] == [a, b, b] ==> False
func sameStringSlice(x, y []string) bool {
	if len(x) != len(y) {
		return false
	}
	// create a map of string -> int
	diff := make(map[string]int, len(x))
	for _, _x := range x {
		// 0 value for int is 0, so just increment a counter for the string
		diff[_x]++
	}
	for _, _y := range y {
		// If the string _y is not in diff bail out early
		if _, ok := diff[_y]; !ok {
			return false
		}
		diff[_y] -= 1
		if diff[_y] == 0 {
			delete(diff, _y)
		}
	}
	return len(diff) == 0
}
