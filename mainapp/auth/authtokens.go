package auth

import (
	"dataplane/database/models"
	"dataplane/logme"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v4"
	uuid2 "github.com/google/uuid"
)

var jwtKey = []byte(os.Getenv("secret.jwt_secret"))

type Claims struct {
	// Standard claims
	jwt.RegisteredClaims

	// custom claims
	AuthenticationType string `json:"authenticationType"`
	PreferredUsername  string `json:"preferred_username"`
	UserType           string `json:"user_type"` //admin or user
}

// GenerateTokens returns the access and refresh tokens
func GenerateTokens(userID string, username string, usertype string, businessID string) (string, string) {
	_, accessToken := GenerateAccessClaims(userID, username, usertype, businessID)
	refreshToken := accessToken

	return accessToken, refreshToken
}

// GenerateAccessClaims returns a claim and a acess_token string
func GenerateAccessClaims(userID string, username string, usertype string, businessID string) (*Claims, string) {

	t := time.Now()

	claim := &Claims{
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(t.Add(5 * time.Minute)), // access token valid for 5 minutes
			IssuedAt:  jwt.NewNumericDate(t),
			NotBefore: jwt.NewNumericDate(t),
			Issuer:    "dataplane.app",
			Subject:   userID,
			ID:        uuid2.New().String(),
			Audience:  []string{businessID}, //business
		},
		AuthenticationType: "PASSWORD",
		PreferredUsername:  username,
		UserType:           usertype, //admin or user
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

	return claim, tokenString
}

// GenerateRefreshClaims returns refresh_token
// func GenerateRefreshClaims(cl *models.Claims) string {
// 	result := db.DBConn.Where(&models.Claims{
// 		StandardClaims: jwt.StandardClaims{
// 			Issuer: cl.Issuer,
// 		},
// 	}).Find(&models.Claims{})

// 	// checking the number of refresh tokens stored. !!!NOT working!!!
// 	// If the number is higher than 3, remove all the refresh tokens and leave only new one.
// 	if result.RowsAffected > 3 {
// 		db.DBConn.Where(&models.Claims{
// 			StandardClaims: jwt.StandardClaims{Issuer: cl.Issuer},
// 		}).Delete(&models.Claims{})
// 	}

// 	t := time.Now()
// 	refreshClaim := &models.Claims{
// 		StandardClaims: jwt.StandardClaims{
// 			Issuer:    cl.Issuer,
// 			ExpiresAt: t.Add(7 * 24 * time.Hour).Unix(),
// 			Subject:   "refresh_token",
// 			IssuedAt:  t.Unix(),
// 		},
// 	}

// 	// create a claim on DB
// 	db.DBConn.Create(&refreshClaim)

// 	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaim)
// 	refreshTokenString, err := refreshToken.SignedString(jwtKey)
// 	if err != nil {
// 		panic(err)
// 	}

// 	return refreshTokenString
// }

// SecureAuth returns a middleware which secures all the private routes
// func SecureAuth() func(*fiber.Ctx) error {
// 	return func(c *fiber.Ctx) error {
// 		accessToken := c.Cookies("access_token")
// 		claims := new(models.Claims)

// 		token, err := jwt.ParseWithClaims(accessToken, claims,
// 			func(token *jwt.Token) (interface{}, error) {
// 				return jwtKey, nil
// 			})

// 		if token.Valid {
// 			if claims.ExpiresAt < time.Now().Unix() {
// 				return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
// 					"error":   true,
// 					"general": "Token Expired",
// 				})
// 			}
// 		} else if ve, ok := err.(*jwt.ValidationError); ok {
// 			if ve.Errors&jwt.ValidationErrorMalformed != 0 {
// 				// this is not even a token, we should delete the cookies here
// 				c.ClearCookie("access_token", "refresh_token")
// 				return c.SendStatus(fiber.StatusForbidden)
// 			} else if ve.Errors&(jwt.ValidationErrorExpired|jwt.ValidationErrorNotValidYet) != 0 {
// 				// Token is either expired or not active yet
// 				return c.SendStatus(fiber.StatusUnauthorized)
// 			} else {
// 				// cannot handle this token
// 				c.ClearCookie("access_token", "refresh_token")
// 				return c.SendStatus(fiber.StatusForbidden)
// 			}
// 		}

// 		c.Locals("id", claims.Issuer)
// 		return c.Next()
// 	}
// }

// GetAuthCookies sends two cookies of type access_token and refresh_token
// func GetAuthCookies(accessToken, refreshToken string) (*fiber.Cookie, *fiber.Cookie) {
// 	accessCookie := &fiber.Cookie{
// 		Name:     "access_token",
// 		Value:    accessToken,
// 		Expires:  time.Now().Add(24 * time.Hour),
// 		HTTPOnly: true,
// 		Secure:   true,
// 	}

// 	refreshCookie := &fiber.Cookie{
// 		Name:     "refresh_token",
// 		Value:    refreshToken,
// 		Expires:  time.Now().Add(10 * 24 * time.Hour),
// 		HTTPOnly: true,
// 		Secure:   true,
// 	}

// 	return accessCookie, refreshCookie
// }
