package testutils

import (
	"bytes"
	"fmt"
	"io"
	"io/ioutil"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"testing"
)

func GraphQLRequestPrivateUpload(token string, url string, folderID string, envID string, pipelineID string, nodeID string, t *testing.T) (responseBody []byte, res *http.Response) {

	method := "POST"

	payload := &bytes.Buffer{}
	writer := multipart.NewWriter(payload)
	_ = writer.WriteField("operations", "{\"query\":\"\\n    mutation uploadFileNode($environmentID: String!, $nodeID: String!, $pipelineID: String!, $folderID: String!, $file: Upload!) {\\n        uploadFileNode(environmentID: $environmentID, nodeID: $nodeID, pipelineID: $pipelineID, folderID: $folderID, file: $file)\\n    }\\n\",\"variables\":{\"environmentID\":\""+envID+"\",\"pipelineID\":\""+pipelineID+"\",\"nodeID\":\""+nodeID+"\",\"folderID\":\""+folderID+"\",\"file\":null}}\n")
	_ = writer.WriteField("map", "{\"1\":[\"variables.file\"]}")

	// not working   ==>    config.CodeDirectory+"dp-entrypoint.py"
	file, errFile3 := os.Open("/appdev/code-files/dp-entrypoint.py")

	if errFile3 != nil {
		fmt.Println(errFile3)
		return
	}

	defer file.Close()

	part3, errFile3 := writer.CreateFormFile("1", filepath.Base("dp-entrypoint.py"))
	if errFile3 != nil {
		fmt.Println(errFile3)
		return
	}

	_, errFile3 = io.Copy(part3, file)
	if errFile3 != nil {
		fmt.Println(errFile3)
		return
	}
	err := writer.Close()
	if err != nil {
		fmt.Println(err)
		return
	}

	client := &http.Client{}
	req, err := http.NewRequest(method, url, payload)

	if err != nil {
		fmt.Println(err)
		return
	}
	req.Header.Add("Authorization", "Bearer "+token)

	req.Header.Set("Content-Type", writer.FormDataContentType())
	res, err = client.Do(req)
	if err != nil {
		fmt.Println(err)
		return
	}
	defer res.Body.Close()

	body, err := ioutil.ReadAll(res.Body)
	if err != nil {
		fmt.Println(err)
		return
	}
	fmt.Println(string(body))

	return body, res
}
