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

		var TasksRun Task

		id := string(c.Params("id"))

		if tmp, ok := Tasks.Get(id); ok {
			TasksRun = tmp.(Task)
		}

		if TasksRun.PID != 0 {
			_ = syscall.Kill(-TasksRun.PID, syscall.SIGKILL)
		}
		TasksRun.Cancel()
		TasksStatus.Set(id, "cancel")

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
