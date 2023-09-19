package utilities

/*
Run performance test on graph cycle
go test -timeout 30s -v -run ^TestGraphCycleSpeedOrig$ github.com/dataplane-app/dataplane/app/mainapp/utilities
*/
// func TestGraphCycleSpeedOrig(t *testing.T) {

// 	// var testNodes = []*models.PipelineNodes{}

// 	var testEdges = []*models.PipelineEdges{}

// 	// Create 1,000 nodes with random edges to ensure an acyclic graph
// 	startTime := time.Now()
// 	for i := 0; i < 100; i++ {
// 		nodeA := fmt.Sprintf("Node%d", i)

// 		// rand.Intn(i+1)
// 		nodeB := fmt.Sprintf("Node%d", i+1)
// 		testEdges = append(testEdges, &models.PipelineEdges{From: nodeA, To: nodeB})
// 	}
// 	elapsedTime := time.Since(startTime)

// 	fmt.Printf("Elapsed creation time: %d ms\n", elapsedTime.Milliseconds())

// 	startTime = time.Now()
// 	outcome := GraphCycleCheck(testEdges, testEdges[0].From)
// 	elapsedTime = time.Since(startTime)

// 	if outcome {
// 		fmt.Println("The graph contains a cycle.")
// 	} else {
// 		fmt.Println("The graph is acyclic.")
// 	}

// 	fmt.Printf("Elapsed cyctime: %d ms\n", elapsedTime.Milliseconds())
// }
