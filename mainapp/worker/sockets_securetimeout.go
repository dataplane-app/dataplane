package worker

import (
	"log"
	"time"
)

func SocketsSecureTimeout() {

	timeoutreturn := 0

	for {

		select {
		case hello := <-Securetimeout:
			log.Println("Hello:", hello)
			// timeoutreturn = timeoutreturn + 1
		default:

			if timeoutreturn > 10 {
				timeoutreturn = 200
			} else {

			}

		}

		Securetimeout <- timeoutreturn
		timeoutreturn = timeoutreturn + 1

		time.Sleep(1000 * time.Millisecond)

	}
}
