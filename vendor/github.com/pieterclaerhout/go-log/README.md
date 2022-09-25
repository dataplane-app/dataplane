## go-log

[![Build Status](https://img.shields.io/github/workflow/status/pieterclaerhout/go-log/Go)](https://github.com/pieterclaerhout/go-log/actions?query=workflow%3AGo)
[![Go Report Card](https://goreportcard.com/badge/github.com/pieterclaerhout/go-log)](https://goreportcard.com/report/github.com/pieterclaerhout/go-log)
[![Documentation](https://godoc.org/github.com/pieterclaerhout/go-log?status.svg)](http://godoc.org/github.com/pieterclaerhout/go-log)
[![license](https://img.shields.io/badge/license-Apache%20v2-orange.svg)](https://github.com/pieterclaerhout/go-log/raw/master/LICENSE)
[![GitHub version](https://badge.fury.io/gh/pieterclaerhout%2Fgo-log.svg)](https://badge.fury.io/gh/pieterclaerhout%2Fgo-log)
[![GitHub issues](https://img.shields.io/github/issues/pieterclaerhout/go-log.svg)](https://github.com/pieterclaerhout/go-log/issues)

This is a [Golang](https://golang.org) library with logging related functions which I use in my different projects.

## Usage

```go
package main

import (
    "github.com/pieterclaerhout/go-log"
)

func main() {

    log.DebugMode = true
    log.DebugSQLMode = true
    log.PrintTimestamp = true
    log.PrintColors = true
    log.TimeFormat = "2006-01-02 15:04:05.000"

    myVar := map[string]string{"hello": "world"}

    log.Debug("arg1", "arg2")
    log.Debugf("arg1 %d", 1)
    log.DebugDump(myVar, "prefix")
    log.DebugSeparator("title")
    log.DebugSQL("select * from mytable")

    log.Info("arg1", "arg2")
    log.Infof("arg1 %d", 1)
    log.InfoDump(myVar, "prefix")
    log.InfoSeparator("title")

    log.Warn("arg1", "arg2")
    log.Warnf("arg1 %d", 1)
    log.WarnDump(myVar, "prefix")
    log.WarnSeparator("title")

    log.Error("arg1", "arg2")
    log.Errorf("arg1 %d", 1)
    log.ErrorDump(myVar, "prefix")
    log.ErrorSeparator("title")

    log.Fatal("arg1", "arg2")
    log.Fatalf("arg1 %d", 1)

    err1 := funcWithError()
    log.StackTrace(err1)

    err2 := funcWithError()
    log.CheckError(err2)

}
```

## Environment variables

The defaults are taken from the environment variables:

* `DEBUG`: `log.DebugMode`
* `DEBUG_SQL`: `log.DebugSQLMode`
* `PRINT_TIMESTAMP`: `log.PrintTimestamp`