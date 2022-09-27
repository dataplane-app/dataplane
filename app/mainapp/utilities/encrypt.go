package utilities

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"io"
)

var Encryptphrase string

//   Takes plain string and returns AES encypted version in base64 format
func Encrypt(text string) (string, error) {

	textByte := []byte(text)
	key := []byte(Encryptphrase)

	// generate a new aes cipher using our 32 byte long key
	c, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}

	// gcm or Galois/Counter Mode, is a mode of operation
	// for symmetric key cryptographic block ciphers
	// - https://en.wikipedia.org/wiki/Galois/Counter_Mode
	gcm, err := cipher.NewGCM(c)
	if err != nil {
		return "", err
	}

	// creates a new byte array the size of the nonce
	// which must be passed to Seal
	nonce := make([]byte, gcm.NonceSize())
	// populates our nonce with a cryptographically secure
	// random sequence
	if _, err = io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}

	// here we encrypt our text using the Seal function
	// Seal encrypts and authenticates plaintext, authenticates the
	// additional data and appends the result to dst, returning the updated
	// slice. The nonce must be NonceSize() bytes long and unique for all
	// time, for a given key.
	encryptedByteArray := gcm.Seal(nonce, nonce, textByte, nil)
	encryptedBase64 := base64.StdEncoding.EncodeToString(encryptedByteArray)

	return encryptedBase64, nil
}

// Takes AES encypted string in base64 format and returns plain string
func Decrypt(text string) (string, error) {

	encryptedTextByte, err := base64.StdEncoding.DecodeString(text)
	if err != nil {
		return "", err
	}
	key := []byte(Encryptphrase)

	c, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}

	gcm, err := cipher.NewGCM(c)
	if err != nil {
		return "", err
	}

	nonceSize := gcm.NonceSize()
	if len(encryptedTextByte) < nonceSize {
		return "", err
	}

	nonce, ciphertext := encryptedTextByte[:nonceSize], encryptedTextByte[nonceSize:]
	plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return "", err
	}

	return string(plaintext), nil
}
