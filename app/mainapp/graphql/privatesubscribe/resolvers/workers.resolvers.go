package privatesubscriberesolvers

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"context"
	privatesubscribegraphql "dataplane/mainapp/graphql/privatesubscribe"
	"dataplane/mainapp/messageq"
	"log"
	"time"

	nats "github.com/nats-io/nats.go"
)

func (r *subscriptionResolver) GetWorkerStats(ctx context.Context) (<-chan *privatesubscribegraphql.WorkerStats, error) {

	workerStats := make(chan *privatesubscribegraphql.WorkerStats, 1)

	go func(ctx context.Context) {

		msgq, err := messageq.NATSencoded.Subscribe("workerstats", func(m *nats.Msg) {
			messageq.NATSencoded.Publish(m.Reply, []byte("ok"))
			log.Println("ok", string(m.Data))
		})

		log.Println("Message q", msgq, err)

		/* create var to send back messages */

		for {
			done := false
			select {
			// case msg := <-ch:
			// 	if msg != nil {
			// 		fmt.Println(msg.Channel, msg.Payload)

			// 		var p generated.Permission
			// 		err := json.Unmarshal([]byte(msg.Payload), &p)
			// 		if err != nil {
			// 			log.Println(err)
			// 		}
			// 		events <- &p
			// 	}

			/* close the connection every minute to refresh auth token */
			case <-time.After(time.Minute):
				msgq.Unsubscribe()
				done = true

			/* If subscription has closed, close connection */
			case <-ctx.Done():
				msgq.Unsubscribe()
				done = true
			}

			if done {
				break
			}
		}

	}(ctx)

	// log.Println("Subscribe", hello, err)

	return workerStats, nil
}

// Subscription returns privatesubscribegraphql.SubscriptionResolver implementation.
func (r *Resolver) Subscription() privatesubscribegraphql.SubscriptionResolver {
	return &subscriptionResolver{r}
}

type subscriptionResolver struct{ *Resolver }
