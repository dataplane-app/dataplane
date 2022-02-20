package utilities

// func GraphFirstNode(nodes []*models.PipelineNodes, edges []*models.PipelineEdges) (string, error) {

// 	var dependencies = make(map[string][]string)

// 	for _, p := range edges {
// 		dependencies[p.To] = append(dependencies[p.To], p.From)
// 	}

// 	for _, p := range nodes {

// 		if _, ok := dependencies[p.NodeID]; ok {
// 			//do something here
// 		} else {
// 			// if node not found with a dependency then thats a first node
// 			return p.NodeID, nil
// 		}
// 	}

// 	return "", errors.New("First node not found")
// }
