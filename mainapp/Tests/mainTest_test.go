package tests

import (
	"log"
	"os"
	"testing"
)

func TestMain(m *testing.M) {
	DbInstance = "hello"
	log.Println("Main hello 😃")
	runTests := m.Run()
	os.Exit(runTests)
}
