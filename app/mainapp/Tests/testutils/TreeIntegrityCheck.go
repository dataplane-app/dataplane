package testutils

import (
	"dataplane/mainapp/code_editor/filesystem"
	"dataplane/mainapp/config"
	"dataplane/mainapp/database"
	"dataplane/mainapp/database/models"
	"log"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TreeIntegrityCheck(environmentID string, pipelineID string, checkType string, t *testing.T) {
	database.DBConnect()

	// Environment folder
	ef := models.CodeFolders{}
	err := database.DBConn.Where("environment_id = ? and level = ?", environmentID, "environment").Find(&ef).Error
	if err != nil {
		log.Println("err: ", err)
	}

	// Pipeline folder
	pf := models.CodeFolders{}
	err = database.DBConn.Where("pipeline_id = ? and level = ?", pipelineID, "pipeline").Find(&pf).Error
	if err != nil {
		log.Println("err: ", err)
	}

	// Node folder
	nf := models.CodeFolders{}
	err = database.DBConn.Where("pipeline_id = ? and folder_name = ?", pipelineID, "TestNodePython").Find(&nf).Error
	if err != nil {
		log.Println("err: ", err)
	}

	// Folder1 folder
	f1 := models.CodeFolders{}
	err = database.DBConn.Where("pipeline_id = ? and folder_name = ?", pipelineID, "Folder1").Find(&f1).Error
	if err != nil {
		log.Println("err: ", err)
	}

	// Folder2 folder
	f2 := models.CodeFolders{}
	err = database.DBConn.Where("pipeline_id = ? and folder_name = ?", pipelineID, "Folder2").Find(&f2).Error
	if err != nil {
		log.Println("err: ", err)
	}

	platformFolderName := ef.ParentID + "_Platform"
	environmentFolderName := ef.FolderID + "_" + ef.FolderName
	pipelineFolderName := pf.FolderID + "_" + pf.FolderName
	nodeFolderName := nf.FolderID + "_" + nf.FolderName
	F1FolderName := f1.FolderID + "_" + f1.FolderName
	F2FolderName := f2.FolderID + "_" + f2.FolderName

	treeBefore := []string{}
	treeBefore2 := []string{}
	treeAfter := []string{}

	switch checkType {
	case "afterMoveFolder":
		treeBefore = []string{
			config.CodeDirectory + platformFolderName + "/" + environmentFolderName + "/" + "pipelines/" + pipelineFolderName + "/",
			config.CodeDirectory + platformFolderName + "/" + environmentFolderName + "/" + "pipelines/" + pipelineFolderName + "/" + nodeFolderName + "/",
			config.CodeDirectory + platformFolderName + "/" + environmentFolderName + "/" + "pipelines/" + pipelineFolderName + "/" + nodeFolderName + "/" + F2FolderName + "/",
			config.CodeDirectory + platformFolderName + "/" + environmentFolderName + "/" + "pipelines/" + pipelineFolderName + "/" + nodeFolderName + "/" + F2FolderName + "/" + F1FolderName}

	case "afterFileCreated":
		treeBefore = []string{
			config.CodeDirectory + platformFolderName + "/" + environmentFolderName + "/" + "pipelines/" + pipelineFolderName + "/",
			config.CodeDirectory + platformFolderName + "/" + environmentFolderName + "/" + "pipelines/" + pipelineFolderName + "/" + nodeFolderName + "/",
			config.CodeDirectory + platformFolderName + "/" + environmentFolderName + "/" + "pipelines/" + pipelineFolderName + "/" + nodeFolderName + "/" + F2FolderName + "/",
			config.CodeDirectory + platformFolderName + "/" + environmentFolderName + "/" + "pipelines/" + pipelineFolderName + "/" + nodeFolderName + "/" + F2FolderName + "/" + F1FolderName,
			config.CodeDirectory + platformFolderName + "/" + environmentFolderName + "/" + "pipelines/" + pipelineFolderName + "/" + nodeFolderName + "/" + F2FolderName + "/" + F1FolderName + "/dp-entrypoint.py"}

	case "afterFileMoved":
		treeBefore = []string{
			config.CodeDirectory + platformFolderName + "/" + environmentFolderName + "/" + "pipelines/" + pipelineFolderName + "/",
			config.CodeDirectory + platformFolderName + "/" + environmentFolderName + "/" + "pipelines/" + pipelineFolderName + "/" + nodeFolderName + "/",
			config.CodeDirectory + platformFolderName + "/" + environmentFolderName + "/" + "pipelines/" + pipelineFolderName + "/" + nodeFolderName + "/" + F2FolderName + "/",
			config.CodeDirectory + platformFolderName + "/" + environmentFolderName + "/" + "pipelines/" + pipelineFolderName + "/" + nodeFolderName + "/" + F2FolderName + "/" + F1FolderName,
			config.CodeDirectory + platformFolderName + "/" + environmentFolderName + "/" + "pipelines/" + pipelineFolderName + "/" + nodeFolderName + "/" + F2FolderName + "/" + "dp-entrypoint.py"}
		treeBefore2 = []string{
			config.CodeDirectory + platformFolderName + "/" + environmentFolderName + "/" + "pipelines/" + pipelineFolderName + "/",
			config.CodeDirectory + platformFolderName + "/" + environmentFolderName + "/" + "pipelines/" + pipelineFolderName + "/" + nodeFolderName + "/",
			config.CodeDirectory + platformFolderName + "/" + environmentFolderName + "/" + "pipelines/" + pipelineFolderName + "/" + nodeFolderName + "/" + F2FolderName + "/",
			config.CodeDirectory + platformFolderName + "/" + environmentFolderName + "/" + "pipelines/" + pipelineFolderName + "/" + nodeFolderName + "/" + F2FolderName + "/" + "dp-entrypoint.py",
			config.CodeDirectory + platformFolderName + "/" + environmentFolderName + "/" + "pipelines/" + pipelineFolderName + "/" + nodeFolderName + "/" + F2FolderName + "/" + F1FolderName}

	case "afterFileRenamed":
		treeBefore = []string{
			config.CodeDirectory + platformFolderName + "/" + environmentFolderName + "/" + "pipelines/" + pipelineFolderName + "/",
			config.CodeDirectory + platformFolderName + "/" + environmentFolderName + "/" + "pipelines/" + pipelineFolderName + "/" + nodeFolderName + "/",
			config.CodeDirectory + platformFolderName + "/" + environmentFolderName + "/" + "pipelines/" + pipelineFolderName + "/" + nodeFolderName + "/" + F2FolderName + "/",
			config.CodeDirectory + platformFolderName + "/" + environmentFolderName + "/" + "pipelines/" + pipelineFolderName + "/" + nodeFolderName + "/" + F2FolderName + "/" + F1FolderName,
			config.CodeDirectory + platformFolderName + "/" + environmentFolderName + "/" + "pipelines/" + pipelineFolderName + "/" + nodeFolderName + "/" + F2FolderName + "/" + "dp-entrypoint_Renamed.py"}
		treeBefore2 = []string{
			config.CodeDirectory + platformFolderName + "/" + environmentFolderName + "/" + "pipelines/" + pipelineFolderName + "/",
			config.CodeDirectory + platformFolderName + "/" + environmentFolderName + "/" + "pipelines/" + pipelineFolderName + "/" + nodeFolderName + "/",
			config.CodeDirectory + platformFolderName + "/" + environmentFolderName + "/" + "pipelines/" + pipelineFolderName + "/" + nodeFolderName + "/" + F2FolderName + "/",
			config.CodeDirectory + platformFolderName + "/" + environmentFolderName + "/" + "pipelines/" + pipelineFolderName + "/" + nodeFolderName + "/" + F2FolderName + "/" + "dp-entrypoint_Renamed.py",
			config.CodeDirectory + platformFolderName + "/" + environmentFolderName + "/" + "pipelines/" + pipelineFolderName + "/" + nodeFolderName + "/" + F2FolderName + "/" + F1FolderName}

	case "afterFileDeleted":
		treeBefore = []string{
			config.CodeDirectory + platformFolderName + "/" + environmentFolderName + "/" + "pipelines/" + pipelineFolderName + "/",
			config.CodeDirectory + platformFolderName + "/" + environmentFolderName + "/" + "pipelines/" + pipelineFolderName + "/" + nodeFolderName + "/",
			config.CodeDirectory + platformFolderName + "/" + environmentFolderName + "/" + "pipelines/" + pipelineFolderName + "/" + nodeFolderName + "/" + F2FolderName + "/",
			config.CodeDirectory + platformFolderName + "/" + environmentFolderName + "/" + "pipelines/" + pipelineFolderName + "/" + nodeFolderName + "/" + F2FolderName + "/" + F1FolderName}

	case "afterFolderDeleted":
		treeBefore = []string{
			config.CodeDirectory + platformFolderName + "/" + environmentFolderName + "/" + "pipelines/" + pipelineFolderName + "/",
			config.CodeDirectory + platformFolderName + "/" + environmentFolderName + "/" + "pipelines/" + pipelineFolderName + "/" + nodeFolderName + "/",
			config.CodeDirectory + platformFolderName + "/" + environmentFolderName + "/" + "pipelines/" + pipelineFolderName + "/" + nodeFolderName + "/" + F2FolderName + "/"}

	case "default":
		treeBefore = []string{
			config.CodeDirectory + platformFolderName + "/" + environmentFolderName + "/" + "pipelines/" + pipelineFolderName + "/",
			config.CodeDirectory + platformFolderName + "/" + environmentFolderName + "/" + "pipelines/" + pipelineFolderName + "/" + nodeFolderName + "/",
			config.CodeDirectory + platformFolderName + "/" + environmentFolderName + "/" + "pipelines/" + pipelineFolderName + "/" + nodeFolderName + "/" + F1FolderName + "/",
			config.CodeDirectory + platformFolderName + "/" + environmentFolderName + "/" + "pipelines/" + pipelineFolderName + "/" + nodeFolderName + "/" + F2FolderName + "/"}
		treeBefore2 = []string{
			config.CodeDirectory + platformFolderName + "/" + environmentFolderName + "/" + "pipelines/" + pipelineFolderName + "/",
			config.CodeDirectory + platformFolderName + "/" + environmentFolderName + "/" + "pipelines/" + pipelineFolderName + "/" + nodeFolderName + "/",
			config.CodeDirectory + platformFolderName + "/" + environmentFolderName + "/" + "pipelines/" + pipelineFolderName + "/" + nodeFolderName + "/" + F2FolderName + "/",
			config.CodeDirectory + platformFolderName + "/" + environmentFolderName + "/" + "pipelines/" + pipelineFolderName + "/" + nodeFolderName + "/" + F1FolderName + "/"}
	}

	path, _ := filesystem.FolderConstructByID(database.DBConn, nf.ParentID, environmentID, "pipelines")
	err = filepath.Walk(config.CodeDirectory+path,
		func(path string, info os.FileInfo, err error) error {
			if err != nil {
				return err
			}
			if info.IsDir() && info.Name() == ".git" {
				return filepath.SkipDir
			}
			treeAfter = append(treeAfter, path)
			return nil
		})
	if err != nil {
		log.Println(err)
	}

	check := stringSlicesEqual(treeBefore, treeAfter)
	check2 := stringSlicesEqual(treeBefore2, treeAfter)

	assert.Equalf(t, (check || check2), true, "File tree integrity check: ", checkType)

}

func stringSlicesEqual(a, b []string) bool {
	if len(a) != len(b) {
		return false
	}
	for i, v := range a {
		if strings.TrimRight(v, "/") != strings.TrimRight(b[i], "/") {
			return false
		}
	}
	return true
}
