package models

type RWMessage struct {
	Request  string
	Status   string //error or OK
	Response string
}
