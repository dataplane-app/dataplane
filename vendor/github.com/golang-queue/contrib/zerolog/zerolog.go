package zerolog

import (
	"fmt"

	"github.com/rs/zerolog/log"
)

// New to create new interface for logger
func New() *Manager {
	return &Manager{}
}

// Manager for zerolog
type Manager struct{}

func (l Manager) Infof(format string, args ...interface{}) {
	log.Info().Msgf(format, args...)
}

func (l Manager) Errorf(format string, args ...interface{}) {
	log.Error().Msgf(format, args...)
}

func (l Manager) Fatalf(format string, args ...interface{}) {
	log.Fatal().Msgf(format, args...)
}

func (l Manager) Debugf(format string, args ...interface{}) {
	log.Debug().Msgf(format, args...)
}

func (l Manager) Info(args ...interface{}) {
	log.Info().Msg(fmt.Sprint(args...))
}

func (l Manager) Error(args ...interface{}) {
	log.Error().Msg(fmt.Sprint(args...))
}

func (l Manager) Fatal(args ...interface{}) {
	log.Fatal().Msg(fmt.Sprint(args...))
}

func (l Manager) Debug(args ...interface{}) {
	log.Debug().Msg(fmt.Sprint(args...))
}
