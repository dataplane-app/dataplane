package runtask

import (
	modelmain "dataplane/mainapp/database/models"
	"dataplane/workers/messageq"
	"log"
	"syscall"
	"time"

	"github.com/gofiber/fiber/v2"
)

func Canceltask() fiber.Handler {

	return func(c *fiber.Ctx) error {

		id := string(c.Params("id"))

		if Tasks[id].PID != 0 {
			_ = syscall.Kill(-Tasks[id].PID, syscall.SIGKILL)
		}
		Tasks[id].Cancel()
		TasksStatus[id] = "cancel"

		TaskUpdate := modelmain.WorkerTasks{
			TaskID: id,
			EndDT:  time.Now().UTC(),
			Status: "Fail",
		}
		var response TaskResponse
		_, errnats := messageq.MsgReply("taskupdate", TaskUpdate, &response)

		if errnats != nil {
			log.Println("Update task error nats:", errnats)
		}

		return c.SendString("Hello 👋! Healthy 🍏")

	}
}
