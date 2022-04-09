package runcodeworker

import (
	"bufio"
	"dataplane/mainapp/code_editor/filesystem"
	"dataplane/mainapp/database/models"
	modelmain "dataplane/mainapp/database/models"
	"dataplane/workers/config"
	"dataplane/workers/database"
	"dataplane/workers/messageq"
	"log"
	"os"
	"os/exec"
	"strings"
	"syscall"
	"time"

	"github.com/google/uuid"
	clog "github.com/pieterclaerhout/go-log"
	"gorm.io/gorm"
)

func CodeLoadPackages(language string, loadpackages string, environmentID string, workerGroup string) {

	var packages models.CodePackages

	var folder models.CodeFolders

	err2 := database.DBConn.Select("folder_id").Where("level = ? and environment_id=? and f_type = ?", "environment", environmentID, "folder").First(&folder)
	if err2.Error != nil {
		log.Println(err2.Error.Error())
		return
	}

	// get all the packages
	languagesplit := strings.Split(language, ",")

	// Get environment folder
	envfolder, _ := filesystem.FolderConstructByID(database.DBConn, folder.FolderID, environmentID, "")
	envfolder = config.CodeDirectory + envfolder

	var packagesfile string
	var cmd *exec.Cmd

	for _, v := range languagesplit {

		if strings.Contains(loadpackages, v) {

			err2 := database.DBConn.Select("packages").Where("language = ? and environment_id=? and worker_group = ?", language, environmentID, workerGroup).First(&packages)
			if err2.Error != nil && err2.Error != gorm.ErrRecordNotFound {
				log.Println(err2.Error.Error())
				continue
			}

			if packages.Packages != "" {

				switch v {
				case "Python":

					packagesfile = envfolder + "requirements.txt"
					err := os.WriteFile(packagesfile, []byte(packages.Packages), 0644)
					if err != nil {
						log.Println("Failed to write file")
						continue
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
		}

	}

}
