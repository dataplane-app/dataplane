package routes

import (
	"log"
	"net/http"
	"net/url"

	"github.com/dataplane-app/dataplane/app/mainapp/authoidc"
	dpconfig "github.com/dataplane-app/dataplane/app/mainapp/config"
	"github.com/dataplane-app/dataplane/app/mainapp/utilities"
	"github.com/gofiber/fiber/v2"
)

func APIRoutes(app *fiber.App) {

	// ------- OIDC Callback ------
	oidcCallback := app.Group("/app/public/oidc")
	oidcCallback.Get("/callback", func(c *fiber.Ctx) error {

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
		claimerror := idToken.Claims(&jsonclaims); if claimerror != nil {
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{
				"Data Platform": "Dataplane",
				"Error":         "Auth token claim error: " + claimerror.Error(),
			})
		}

		// Extract the email from the claims
		userEmail, emailExist := jsonclaims[dpconfig.OIDCClaimEmail]; 
		if !emailExist {
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{
				"Data Platform": "Dataplane",
				"Error":         "User email not found in OIDC claims.",
			})
		}

		// Extract the role from the claims
		userRole, roleExist := jsonclaims[dpconfig.OIDCClaimRole];
		if roleExist {
		}

		log.Println("Extracted values", userEmail, userRole)

		// log.Println("🔒 Verify Token: ", idToken.Subject, idToken.Nonce)

		// log.Println("🔒 Claim Email: ", jsonclaims[dpconfig.OIDCClaimEmail])

		// log.Println("🔒 Claims: ", jsonclaims)

		// Check state and nonce

		// Check that any permissions are attached for access

		// Map the user to user in the database - if user doesn't exist then check if auto register is enabled

		// If the token is verified then we can log the user in. 

		return c.JSON(&fiber.Map{"authstrategy": dpconfig.AuthStrategy})
	})

	// ------- OPEN ROUTES ------
	public := app.Group("/app/public/api")

	// Auth strategy for OPenID Connect and Login
	public.Post("/authstrategy", func(c *fiber.Ctx) error {
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

			paramValues.Add("state", state)
			paramValues.Add("nonce", nonce)

			authUrl.RawQuery = paramValues.Encode()

			encodedUrl := authUrl.String()

			log.Println("🔒 Auth URL: ", encodedUrl)

			return c.JSON(&fiber.Map{"authstrategy": dpconfig.AuthStrategy, "authurl": encodedUrl})

		} else {
			return c.JSON(&fiber.Map{"authstrategy": dpconfig.AuthStrategy})
		}

	})
}
