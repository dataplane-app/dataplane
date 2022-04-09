package runcodeworker

import (
	"bufio"
	"dataplane/mainapp/database/models"
	modelmain "dataplane/mainapp/database/models"
	"dataplane/workers/config"
	"dataplane/workers/database"
	"dataplane/workers/messageq"
	"log"
	"os"
	"os/exec"
	"syscall"
	"time"

	"github.com/google/uuid"
	clog "github.com/pieterclaerhout/go-log"
	"gorm.io/gorm"
)

func CodeUpdatePackage(language string, envfolder string, environmentID string, workerGroup string) error {

	var packagesfile string
	var cmd *exec.Cmd
	var packages models.CodePackages

	err2 := database.DBConn.Select("packages").Where("language = ? and environment_id=? and worker_group = ?", language, environmentID, workerGroup).First(&packages)
	if err2.Error != nil && err2.Error != gorm.ErrRecordNotFound {
		log.Println(err2.Error.Error())
		return err2.Error
	}

	if packages.Packages != "" {

		switch language {
		case "Python":

			packagesfile = envfolder + "requirements.txt"
			err := os.WriteFile(packagesfile, []byte(packages.Packages), 0644)
			if err != nil {
				log.Println("Failed to write file")
			}

			cmd = exec.Command("pip3", "install", "-r", packagesfile)

		}

		cmd.SysProcAttr = &syscall.SysProcAttr{Setpgid: true}

		// Get a pipe to read from standard out
		r, _ := cmd.StdoutPipe()
		// Make a new channel which will be used to ensure we get all output
		done := make(chan struct{})
		scanner := bufio.NewScanner(r)

		// Use the scanner to scan the output line by line and log it
		// It's running in a goroutine so that it doesn't block
		go func() {

			// Read line by line and process it
			for scanner.Scan() {
				uid := uuid.NewString()
				line := config.Secrets.Replace(scanner.Text())

				sendmsg := modelmain.LogsSend{
					CreatedAt: time.Now().UTC(),
					UID:       uid,
					Log:       line,
					LogType:   "info",
				}

				messageq.MsgSend("codepackage."+environmentID+"."+workerGroup, sendmsg)
				if config.Debug == "true" {
					clog.Info(line)
				}
			}

			// We're all done, unblock the channel
			done <- struct{}{}

		}()

		// ------ Error logging -----------
		rErr, _ := cmd.StderrPipe()

		// Make a new channel which will be used to ensure we get all output
		doneErr := make(chan struct{})

		// Create a scanner which scans r in a line-by-line fashion
		scannerErr := bufio.NewScanner(rErr)

		// Use the scanner to scan the output line by line and log it
		// It's running in a goroutine so that it doesn't block
		go func() {

			// Read line by line and process it
			for scannerErr.Scan() {
				uid := uuid.NewString()
				line := config.Secrets.Replace(scannerErr.Text())

				sendmsg := modelmain.LogsSend{
					CreatedAt: time.Now().UTC(),
					UID:       uid,
					Log:       line,
					LogType:   "error",
				}

				messageq.MsgSend("codepackage."+environmentID+"."+workerGroup, sendmsg)
				if config.Debug == "true" {
					clog.Error(line)
				}
			}

			// We're all done, unblock the channel
			doneErr <- struct{}{}

		}()

		err := cmd.Start()
		if err != nil {

			uid := uuid.NewString()
			line := config.Secrets.Replace(err.Error())

			sendmsg := modelmain.LogsSend{
				CreatedAt: time.Now().UTC(),
				UID:       uid,
				Log:       line,
				LogType:   "error",
			}

			messageq.MsgSend("codepackage."+environmentID+"."+workerGroup, sendmsg)
			if config.Debug == "true" {
				clog.Error(line)
			}

		}

		// Wait for all output to be processed
		<-done
		<-doneErr

		// Wait for the command to finish
		cmd.Wait()

		log.Println("📦 Loaded "+language+" packages in", packagesfile)
	}
	return nil
}
