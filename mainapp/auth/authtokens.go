package auth

import (
	"dataplane/database"
	"dataplane/database/models"
	"dataplane/logme"
	"fmt"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v4"
	uuid2 "github.com/google/uuid"
	"github.com/lestrrat-go/jwx/jwa"
	jwt2 "github.com/lestrrat-go/jwx/jwt"
)

var jwtKey = []byte(os.Getenv("secret_jwt_secret"))

type Claims struct {
	// Standard claims
	jwt.RegisteredClaims

	// custom claims
	AuthenticationType string `json:"authenticationType"`
	PreferredUsername  string `json:"preferred_username"`
	UserType           string `json:"user_type"` //admin or user
	PlatformID         string `json:"platform_id"`
}

// GenerateTokens returns the access and refresh tokens
func GenerateTokens(userID string, username string, usertype string) (string, string) {
	accessToken := GenerateAccessClaims(userID, username, usertype)
	refreshToken := GenerateRefreshToken(userID)

	return accessToken, refreshToken
}

// GenerateAccessClaims returns a claim and a acess_token string
func GenerateAccessClaims(userID string, username string, usertype string) string {

	t := time.Now()

	claim := &Claims{
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(t.Add(5 * time.Minute)), // access token valid for 5 minutes
			IssuedAt:  jwt.NewNumericDate(t),
			NotBefore: jwt.NewNumericDate(t),
			Issuer:    "dataplane.app",
			Subject:   userID,
			ID:        uuid2.New().String(),
			Audience:  []string{"dataplane"}, //business
		},
		AuthenticationType: "PASSWORD",
		PreferredUsername:  username,
		UserType:           usertype, //admin or user
		PlatformID:         database.PlatformID,
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claim)
	tokenString, err := token.SignedString(jwtKey)
	if err != nil {
		logme.PlatformLogger(models.LogsPlatform{
			Environment: "d_platform",
			Category:    "platform",
			LogType:     "error", //can be error, info or debug
			Log:         err.Error(),
		})
		panic(err)
	}

	return tokenString
}

// GenerateRefreshClaims returns refresh_token
func GenerateRefreshToken(userID string) string {

	// remove stale refresh tokens
	go database.DBConn.Delete(&models.AuthRefreshTokens{}, "expires < ? and user_id =?", time.Now(), userID)

	t := time.Now()
	expires := t.Add(14 * 24 * time.Hour)

	refreshclaims := &Claims{
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expires), // access token valid for 2 weeks
			IssuedAt:  jwt.NewNumericDate(t),
			NotBefore: jwt.NewNumericDate(t),
			Issuer:    "dataplane.app",
			Subject:   userID,
			ID:        uuid2.New().String(),
			Audience:  []string{"dataplane"}, //business
		},
	}

	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshclaims)

	refreshTokenString, err := refreshToken.SignedString(jwtKey)
	if err != nil {
		logme.PlatformLogger(models.LogsPlatform{
			Environment: "d_platform",
			Category:    "platform",
			LogType:     "error", //can be error, info or debug
			Log:         err.Error(),
		})
		panic(err)
	}

	// 	// create a claim on DB
	err = database.DBConn.Create(&models.AuthRefreshTokens{
		UserID:       userID,
		RefreshToken: refreshTokenString,
		Expires:      expires,
	}).Error

	if err != nil {
		logme.PlatformLogger(models.LogsPlatform{
			Environment: "d_platform",
			Category:    "platform",
			LogType:     "error", //can be error, info or debug
			Log:         err.Error(),
		})
		panic(err)
	}

	return refreshTokenString
}

/* Exchange new access token for valid refresh token */
func RenewAccessToken(refreshToken string) (string, error) {

	// validate the refresh token
	token, err := jwt2.Parse(
		[]byte(refreshToken),
		jwt2.WithValidate(true),
		jwt2.WithVerify(jwa.HS256, []byte(jwtKey)))

	if err != nil {
		return "", fmt.Errorf("token error: %v", err)
	}

	// retrieve refresh token
	refreshDB := models.AuthRefreshTokens{}
	err = database.DBConn.Select("user_id", "refresh_token").Where("expires > ? and user_id =? and refresh_token=?", time.Now(), token.Subject(), refreshToken).Find(&refreshDB).Error

	// https://gorm.io/docs/error_handling.html#ErrRecordNotFound
	// Error or record not found
	if err != nil {
		return "", err
	}

	user := models.Users{}
	err = database.DBConn.Select("user_id", "username", "user_type").Where("user_id =?", token.Subject()).Find(&user).Error
	if err != nil {
		return "", err
	}

	accessToken := GenerateAccessClaims(user.UserID, user.Username, user.UserType)

	return accessToken, nil
}

/* Validate access token */
func ValidateAccessToken(accessToken string) (bool, *Claims) {

	// validate the refresh token
	token, err := jwt2.Parse(
		[]byte(accessToken),
		jwt2.WithValidate(true),
		jwt2.WithVerify(jwa.HS256, []byte(jwtKey)))

	if err != nil {
		return false, nil
	}

	customclaims := token.PrivateClaims()

	return true, &Claims{
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(token.Expiration()), // access token valid for 5 minutes
			IssuedAt:  jwt.NewNumericDate(token.IssuedAt()),
			NotBefore: jwt.NewNumericDate(token.NotBefore()),
			Issuer:    token.Issuer(),
			Subject:   token.Subject(),
			ID:        token.JwtID(),
			Audience:  token.Audience(), //business
		},
		AuthenticationType: customclaims["authenticationType"].(string),
		PreferredUsername:  customclaims["preferred_username"].(string),
		UserType:           customclaims["user_type"].(string), //admin or user
		PlatformID:         customclaims["platform_id"].(string),
	}
}
