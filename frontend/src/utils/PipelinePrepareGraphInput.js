// ----- Utility functions
export function prepareInputForFrontend(input) {
    const edgesInput = [];
    const nodesInput = [];

    if (input && Object.keys(input).length > 0) {
        for (const edge of input.edges) {
            edgesInput.push({
                source: edge.from,
                sourceHandle: edge.meta.sourceHandle,
                target: edge.to,
                targetHandle: edge.meta.targetHandle,
                type: edge.meta.edgeType,
                arrowHeadType: edge.meta.arrowHeadType,
                id: edge.edgeID,
            });
        }

        for (const node of input.nodes) {
            let data = {
                ...node.meta?.data,
                name: node.name,
                description: node.description,
                workerGroup: node.workerGroup,
                commands: node.commands,
                triggerOnline: node.triggerOnline,
            };
            nodesInput.push({
                id: node.nodeID,
                type: node.nodeTypeDesc + 'Node',
                position: {
                    x: node.meta?.position?.x || 0,
                    y: node.meta?.position?.y || 0,
                },
                data,
            });
        }
    }

    return [...edgesInput, ...nodesInput];
}
