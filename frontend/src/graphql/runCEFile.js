import { gql, GraphQLClient } from 'graphql-request';
import { useGlobalAuthState } from '../Auth/UserAuth';

const graphlqlEndpoint = import.meta.env.VITE_GRAPHQL_ENDPOINT_PRIVATE;

const query = gql`
    mutation runCEFile(
        $pipelineID: String!
        $environmentID: String!
        $nodeID: String!
        $fileID: String!
        $NodeTypeDesc: String!
        $workerGroup: String!
        $runID: String!
        $replayType: String!
        $replayRunID: String!
    ) {
        runCEFile(
            pipelineID: $pipelineID
            environmentID: $environmentID
            nodeID: $nodeID
            fileID: $fileID
            NodeTypeDesc: $NodeTypeDesc
            workerGroup: $workerGroup
            runID: $runID
            replayType: $replayType
            replayRunID: $replayRunID
        ) {
            run_id
            node_id
            file_id
            status
            environment_id
            created_at
            ended_at
            updated_at
        }
    }
`;

export const useRunCEFile = () => {
    const authState = useGlobalAuthState();
    const jwt = authState.authToken.get();

    const headers = {
        Authorization: 'Bearer ' + jwt,
    };

    const client = new GraphQLClient(graphlqlEndpoint, {
        headers,
    });

    return async (input) => {
        try {
            const res = await client.request(query, input);
            return res?.runCEFile;
        } catch (error) {
            return JSON.parse(JSON.stringify(error, undefined, 2)).response;
        }
    };
};
