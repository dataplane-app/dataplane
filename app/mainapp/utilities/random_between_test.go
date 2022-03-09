package utilities

import (
	"log"
	"testing"

	"github.com/stretchr/testify/assert"
)

var tests = []*pairs{
	{1, 1},
	{1, 2},
	{1, 23},
	{10, 23},
}

type pairs struct {
	Min int
	Max int
}

/*
Run Random function test
go test -count=1 -timeout 30s -v -run ^TestRandBetweenInt$ dataplane/mainapp/utilities
*/

func TestRandBetweenInt(t *testing.T) {
	for _, v := range tests {
		outcome := RandBetweenInt(v.Min, v.Max)
		log.Println(v.Min, v.Max)
		assert.Equalf(t, true, outcome >= v.Min, "Random min check")
		assert.Equalf(t, true, outcome <= v.Max, "Random max check")
	}
}
