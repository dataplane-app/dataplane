package storage

import "strings"

type Scope int

const (
	ScopeRead Scope = 1 << iota
	ScopeWrite
	ScopeDelete
	ScopeSignURL

	ScopeRW  = ScopeRead | ScopeWrite
	ScopeRWD = ScopeRW | ScopeDelete
)

func (s Scope) Has(s2 Scope) bool {
	return s&s2 == s2
}

func (s Scope) String() string {
	if s == 0 {
		return "none"
	}

	var scopes []string
	if s.Has(ScopeRead) {
		scopes = append(scopes, "read")
	}
	if s.Has(ScopeWrite) {
		scopes = append(scopes, "write")
	}
	if s.Has(ScopeDelete) {
		scopes = append(scopes, "delete")
	}
	if s.Has(ScopeSignURL) {
		scopes = append(scopes, "sign")
	}

	return strings.Join(scopes, ",")
}
