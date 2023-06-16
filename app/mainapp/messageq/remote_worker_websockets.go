package messageq

import "github.com/dataplane-app/dataplane/app/mainapp/database/models"

var WebsocketRWChannel = make(chan models.WSChannelMessage)
