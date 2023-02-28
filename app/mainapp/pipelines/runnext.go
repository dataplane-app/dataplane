package pipelines

import (
	dpconfig "github.com/dataplane-app/dataplane/app/mainapp/config"

	"github.com/dataplane-app/dataplane/app/mainapp/database/models"
	"github.com/dataplane-app/dataplane/app/mainapp/logging"
	"github.com/dataplane-app/dataplane/app/mainapp/messageq"
)

func RunNextPipeline() {

	_, err := messageq.NATSencoded.QueueSubscribe("pipeline-run-next", "runnext", func(subj, reply string, msg models.WorkerTaskSend) {

		RunNext(msg)

	})

	if err != nil {
		if dpconfig.Debug == "true" {
			logging.PrintSecretsRedact(err)
		}

	}

}
