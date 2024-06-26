package authoidc

import (
	"context"
	"log"
	"strings"

	"github.com/coreos/go-oidc/v3/oidc"
	dpconfig "github.com/dataplane-app/dataplane/app/mainapp/config"
	"golang.org/x/oauth2"
)

var OIDCProvider *oidc.Provider
var OIDCConfig oauth2.Config
var OIDCVerifier *oidc.IDTokenVerifier

/* This function will pull the data from the well known configuration of OIDC and keep as variable on startup */
func OIDCConnect(){

		ctx := context.Background()
	
		// Setup OIDC provider
		var err error
		OIDCProvider, err = oidc.NewProvider(ctx, dpconfig.OIDCIssuerEndpoint)
		if err != nil {
			log.Fatalf("Failed to get provider: %v", err)
		}

		dpconfig.OIDCAuthURL = OIDCProvider.Endpoint().AuthURL

		log.Println("🔒 Got provider: %v", dpconfig.OIDCAuthURL)

		// Construct oauth2 config
		OIDCConfig = oauth2.Config{
			ClientID:     dpconfig.OIDCClientID,
			ClientSecret: dpconfig.OIDCClientSecret,
			RedirectURL:  dpconfig.OIDCRedirectURI,
			Endpoint:     OIDCProvider.Endpoint(),
			Scopes:       strings.Split(dpconfig.OIDCScope, " "),

		}

		OIDCVerifier = OIDCProvider.Verifier(&oidc.Config{
			ClientID: dpconfig.OIDCClientID,
			
		})
	

	}