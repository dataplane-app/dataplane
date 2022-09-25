package runtask

import (
	"log"
	"syscall"
	"time"

	modelmain "github.com/dataplane-app/dataplane/app/mainapp/database/models"

	"github.com/dataplane-app/dataplane/app/workers/messageq"

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
		var response modelmain.TaskResponse
		_, errnats := messageq.MsgReply("taskupdate", TaskUpdate, &response)

		if errnats != nil {
			log.Println("Update task error nats:", errnats)
		}

		return c.SendString("Hello 👋! Healthy 🍏")

	}
}
