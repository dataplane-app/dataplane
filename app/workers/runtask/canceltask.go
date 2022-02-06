package runtask

import (
	"syscall"

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

		return c.SendString("Hello 👋! Healthy 🍏")

	}
}
