package main

import (
	"dataplane/mainapp/database"
	"fmt"
	"log"
	"time"

	"github.com/tidwall/buntdb"
)

// Cycle:
// node1 > [node2, node3, node4] > node5 > node6 > node1

var messages = make(chan string)

func main() {
	fmt.Println("GoLang, Graph DFS and BFS implementation")
	fmt.Println("DFS : Depth First Search")
	fmt.Println("BFS : Breadth First Search")

	database.GoDBEdges.Update(func(tx *buntdb.Tx) error {
		tx.Set("edge1", `{"From":"node1", "To":"node2", "pipeline":"1","Env":"Development"}`, nil)
		tx.Set("edge2", `{"From":"node1", "To":"node3", "pipeline":"1","Env":"Development"}`, nil)
		tx.Set("edge3", `{"From":"node1", "To":"node4", "pipeline":"1","Env":"Development"}`, nil)
		tx.Set("edge4", `{"From":"node2", "To":"node5", "pipeline":"1","Env":"Development"}`, nil)
		tx.Set("edge5", `{"From":"node3", "To":"node5", "pipeline":"1","Env":"Development"}`, nil)
		tx.Set("edge6", `{"From":"node4", "To":"node5", "pipeline":"1","Env":"Development"}`, nil)
		tx.Set("edge7", `{"From":"node5", "To":"node6", "pipeline":"1","Env":"Development"}`, nil)
		return nil
	})

	// msg := <-messages
	// fmt.Println(msg)
}

func RunTask(node string) {

	log.Println("go routine: " + node)
	messages <- node
	time.Sleep(1 * time.Second)

}

func Destinations(startingNode string) {

}

func Sources(startingNode string) {

}
