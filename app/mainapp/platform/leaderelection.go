package platform

import (
	"dataplane/mainapp/database"
	"dataplane/mainapp/database/models"
	"dataplane/mainapp/messageq"
	"dataplane/mainapp/utilities"
	"dataplane/workers/logging"
	"log"
)

func LeaderElection() {

	var platformNodes []*models.PlatformNodes
	err := database.DBConn.Find(&platformNodes).Error
	if err != nil {
		logging.PrintSecretsRedact("Platform nodes leader election:", err)

	}

	var leader []string
	for _, v := range platformNodes {

		// append all leaders to a list
		if v.Lead {
			leader = append(leader, v.NodeID)
		}
	}

	// Test for zero or two or more leaders
	if len(leader) != 1 {
		// Evict all leaders and randomly choose one
		newLeaderIndex := utilities.RandBetweenInt(1, len(platformNodes)) - 1
		if newLeaderIndex < 0 {
			newLeaderIndex = 0
		}

		err := database.DBConn.Exec(`
		update platform_nodes set
		lead = case 
			when node_id = ? then true else false 
			end
		`, platformNodes[newLeaderIndex].NodeID).Error
		if err != nil {
			log.Println(err)

		}

		// Let everyone know who the new leader is
		var data = models.PlatformNodeUpdate{
			Leader: platformNodes[newLeaderIndex].NodeID,
			Status: "leaderelect",
		}

		err = messageq.MsgSend("mainapplead", data)
		if err != nil {
			logging.PrintSecretsRedact("NATS error:", err)
		}

	}

}
