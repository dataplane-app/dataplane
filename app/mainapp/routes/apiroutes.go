package routes

import (
	"fmt"
	"log"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/dataplane-app/dataplane/app/mainapp/auth"
	"github.com/dataplane-app/dataplane/app/mainapp/authoidc"
	dpconfig "github.com/dataplane-app/dataplane/app/mainapp/config"
	"github.com/dataplane-app/dataplane/app/mainapp/database"
	"github.com/dataplane-app/dataplane/app/mainapp/database/models"
	"github.com/dataplane-app/dataplane/app/mainapp/utilities"
	"github.com/go-redis/redis/v8"
	"github.com/gofiber/fiber/v2"
)

func APIRoutes(app *fiber.App) {

	// ------- OPEN ROUTES ------
	public := app.Group("/app/public/api")
	public.Get("/oidc/callback", func(c *fiber.Ctx) error {

		ctx := c.Context()

		oauth2Token, erra := authoidc.OIDCConfig.Exchange(ctx, c.Query("code"))
		if erra != nil {
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{
				"Data Platform": "Dataplane",
				"Error":         "Auth token exchange error: " + erra.Error(),
			})
			// handle error
		}

		// log.Println("🔒 Token: ", oauth2Token.Extra("id_token").(string))

		// Extract the ID Token from OAuth2 token.
		rawIDToken, ok := oauth2Token.Extra("id_token").(string)
		if !ok {
			// handle missing token
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{
				"Data Platform": "Dataplane",
				"Error":         "ID token extract error: not found.",
			})
		}

		// Parse and verify ID Token payload.
		idToken, errv := authoidc.OIDCVerifier.Verify(ctx, rawIDToken)
		if errv != nil {
			// handle error
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{
				"Data Platform": "Dataplane",
				"Error":         "Auth token verify error: " + errv.Error(),
			})
		}

		// Map the user to given claim name
		var jsonclaims map[string]interface{}
		claimerror := idToken.Claims(&jsonclaims)
		if claimerror != nil {
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{
				"Data Platform": "Dataplane",
				"Error":         "Auth token claim error: " + claimerror.Error(),
			})
		}

		// Extract the email from the claims
		userEmail, emailExist := jsonclaims[dpconfig.OIDCClaimEmail]
		if !emailExist {
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{
				"Data Platform": "Dataplane",
				"Error":         "User email not found in OIDC claims.",
			})
		}

		// Extract the role from the claims and check if role is allowed
		if dpconfig.OIDCClaimRoleKey != "" {

			// log.Println("5: ", dpconfig.OIDCClaimRoleKey)
			userRole, roleExist := jsonclaims[dpconfig.OIDCClaimRoleKey]
			// log.Println("Role Exist", roleExist, userRole.([]interface{}))
			if roleExist == false {
				return c.Status(http.StatusUnauthorized).JSON(fiber.Map{
					"Data Platform": "Dataplane",
					"Error":         "Expected Role in OIDC claims.",
				})
			}

			// Convert interface to list of strings
			stringRoles := make([]string, len(userRole.([]interface{})))
			for i, v := range userRole.([]interface{}) {
				stringRoles[i] = fmt.Sprint(v)
			}

			// Check if the role is in the allowed list
			roleValues := strings.Split(dpconfig.OIDCClaimRoleValues, ",")
			for _, vRole := range stringRoles {
				if utilities.InArray(vRole, roleValues) == false {
					return c.Status(http.StatusUnauthorized).JSON(fiber.Map{
						"Data Platform": "Dataplane",
						"Error":         "Role not allowed.",
					})
				}
			}
		}

		// log.Println("Extracted values", userEmail, userRole)

		// log.Println("🔒 Verify Token: ", idToken.Subject, idToken.Nonce)

		// log.Println("🔒 Claim Email: ", jsonclaims[dpconfig.OIDCClaimEmail])

		// log.Println("🔒 Claims: ", jsonclaims)

		// Check state and nonce
		type nCheck struct {
			Nonce string `redis:"nonce"`
			State string `redis:"state"`
		}
		var nonceCheck = nCheck{}
		if err := database.RedisConn.HGetAll(ctx, "nonce-"+idToken.Nonce).Scan(&nonceCheck); err != nil {
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{
				"Data Platform": "Dataplane",
				"Error":         "Request expired. SSO nonce or state not found, please login again.",
			})
		}

		if nonceCheck.State != c.Query("state") {
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{
				"Data Platform": "Dataplane",
				"Error":         "Request expired. SSO state not found, please login again.",
			})
		}

		// Delete redis key once used:
		database.RedisConn.Del(ctx, "nonce-"+idToken.Nonce)

		// Check that any permissions are attached for access

		// Map the user to user in the database - if user doesn't exist then check if auto register is enabled
		u := models.Users{}
		if res := database.DBConn.Where(
			&models.Users{Username: userEmail.(string), Active: true},
		).First(&u); res.RowsAffected <= 0 {

			// If auto register is not enabled then return unauthorized
			if dpconfig.OIDCAutoRegister != "true" {
				return c.Status(http.StatusUnauthorized).JSON(fiber.Map{
					"Data Platform": "Dataplane",
					"Error":         "User: " + userEmail.(string) + " not found.",
				})
			} else {
				// Else create the user - they will need to update their name in settings
				u.Email = userEmail.(string)
				u.FirstName = "New User"
				u.LastName = "Update name"
				u.Username = userEmail.(string)
				userData, userError := authoidc.OIDCCreateUser(u)
				if userError != nil {
					return c.Status(http.StatusUnauthorized).JSON(fiber.Map{
						"Data Platform": "Dataplane",
						"Error":         "User: " + userEmail.(string) + " not created.",
					})
				}
				u.UserID = userData.UserID
			}
		}

		// If the token is verified then we can log the user in.
		accessToken, refreshToken := auth.GenerateTokens(u.UserID, u.Username, u.UserType)

		return c.JSON(&fiber.Map{"access_token": accessToken, "refresh_token": refreshToken})
	})

	// Auth strategy for OPenID Connect and Login
	public.Post("/authstrategy", func(c *fiber.Ctx) error {

		ctx := c.Context()
		// authAurl :=
		if dpconfig.AuthStrategy == "openid" {

			// Construct the auth url:
			authUrl, err := url.Parse(dpconfig.OIDCAuthURL)
			if err != nil {
				log.Println("OIDC Url Error: ", err)
				return c.JSON(&fiber.Map{"authstrategy": "login", "error": err.Error()})
			}

			// Add OIDC parameters:
			paramValues := authUrl.Query()
			paramValues.Add("client_id", dpconfig.OIDCClientID)
			paramValues.Add("response_type", "code")
			paramValues.Add("scope", dpconfig.OIDCScope)
			paramValues.Add("redirect_uri", dpconfig.OIDCRedirectURI)

			// Generate state and nonce
			state, err1 := utilities.GenerateRandomString(32)
			if err1 != nil {
				log.Println("Failed to generate state: %v", err1)
				return c.Status(http.StatusUnauthorized).JSON(fiber.Map{
					"Data Platform": "Dataplane",
					"Error":         "Failed to generate state: " + err1.Error(),
				})
			}
			nonce, err2 := utilities.GenerateRandomString(32)
			if err2 != nil {
				log.Fatalf("Failed to generate nonce: %v", err2)
				return c.Status(http.StatusUnauthorized).JSON(fiber.Map{
					"Data Platform": "Dataplane",
					"Error":         "Failed to generate nonce: " + err2.Error(),
				})
			}

			// Add state and nonce to Redis - keep for 24 hours
			if _, errredis := database.RedisConn.Pipelined(ctx, func(rdb redis.Pipeliner) error {
				rdb.Expire(ctx, "nonce-"+nonce, 24*time.Hour)
				rdb.HSet(ctx, "nonce-"+nonce, "nonce", nonce)
				rdb.HSet(ctx, "nonce-"+nonce, "state", state)
				return nil
			}); errredis != nil {
				return c.Status(http.StatusUnauthorized).JSON(fiber.Map{
					"Data Platform": "Dataplane",
					"Error":         "Failed to store nonce and state: " + errredis.Error(),
				})
			}

			paramValues.Add("state", state)
			paramValues.Add("nonce", nonce)

			authUrl.RawQuery = paramValues.Encode()

			encodedUrl := authUrl.String()

			// log.Println("🔒 Auth URL: ", encodedUrl)

			return c.JSON(&fiber.Map{"authstrategy": dpconfig.AuthStrategy, "authurl": encodedUrl})

		} else {
			return c.JSON(&fiber.Map{"authstrategy": dpconfig.AuthStrategy})
		}

	})
}
