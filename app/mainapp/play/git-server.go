package main

import (
	"context"
	"fmt"
	"log"
	"net/http"

	"github.com/go-git/go-billy/v5/osfs"
	"github.com/go-git/go-git/v5/plumbing/cache"
	"github.com/go-git/go-git/v5/plumbing/format/pktline"
	"github.com/go-git/go-git/v5/plumbing/protocol/packp"
	"github.com/go-git/go-git/v5/plumbing/storer"
	"github.com/go-git/go-git/v5/plumbing/transport"
	"github.com/go-git/go-git/v5/plumbing/transport/server"
	"github.com/go-git/go-git/v5/storage/filesystem"
	//	"gopkg.in/src-d/go-git.v4/storage/memory"
)

type mySimpleLoader struct{}

func (mySimpleLoader) Load(_ *transport.Endpoint) (storer.Storer, error) {
	fs := filesystem.NewStorage(osfs.New("/tmp/hello_world.git"), cache.NewObjectLRUDefault()) // this does not work.
	return fs, fs.Init()
	// return memory.NewStorage(), nil // this works.
}

type GitHTTPService struct{}

func (g *GitHTTPService) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	log.Printf("[http] %s %s", r.Method, r.URL.RequestURI())

	switch r.Method {
	case http.MethodGet:
		g.listReferences(w, r)
	case http.MethodPost:
		g.receivePack(w, r)
	}
}

func (*GitHTTPService) listReferences(w http.ResponseWriter, r *http.Request) {
	defer r.Body.Close()

	w.Header().Add("Content-Type", "application/x-git-receive-pack-advertisement")
	w.WriteHeader(200)

	session := server.NewServer(mySimpleLoader{})
	ts, err := session.NewReceivePackSession(&transport.Endpoint{}, nil)
	if err != nil {
		fmt.Println(err)
	}
	defer ts.Close()

	adv, err := ts.AdvertisedReferences()
	if err != nil {
		fmt.Println(err)
	}

	// Enable smart protocol for http
	enc := pktline.NewEncoder(w)
	enc.Encode([]byte("# service=git-receive-pack\n"))
	enc.Encode(nil)

	if err := adv.Encode(w); err != nil {
		fmt.Println(err)
	}
}

func (*GitHTTPService) receivePack(w http.ResponseWriter, r *http.Request) {
	defer r.Body.Close()

	w.Header().Add("Content-Type", "application/x-git-receive-pack-result")
	w.WriteHeader(200)

	session := server.NewServer(mySimpleLoader{})
	ts, err := session.NewReceivePackSession(&transport.Endpoint{}, nil)
	if err != nil {
		fmt.Println(err)
	}
	defer ts.Close()

	req := packp.NewReferenceUpdateRequest()
	if err := req.Decode(r.Body); err != nil {
		return
	}

	status, err := ts.ReceivePack(context.TODO(), req)
	if status != nil {
		if err := status.Encode(w); err != nil {
			fmt.Println(err)
		}
	}

	if err != nil {
		fmt.Println(err)
	}
}

func main() {
	fmt.Println(http.ListenAndServe(":11000", &GitHTTPService{}))
}
