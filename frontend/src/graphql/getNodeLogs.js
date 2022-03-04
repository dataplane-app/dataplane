import { gql, GraphQLClient } from 'graphql-request';
import { useGlobalAuthState } from '../Auth/UserAuth';

const graphlqlEndpoint = process.env.REACT_APP_GRAPHQL_ENDPOINT_PRIVATE;

const query = gql`
    query getNodeLogs($pipelineID: String!, $runID: String!, $environmentID: String!, $nodeID: String!) {
        getNodeLogs(pipelineID: $pipelineID, runID: $runID, nodeID: $nodeID, environmentID: $environmentID) {
            created_at
            log
            log_type
        }
    }
`;

export const useGetNodeLogs = () => {
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
            return res?.getNodeLogs;
        } catch (error) {
            return JSON.parse(JSON.stringify(error, undefined, 2)).response;
        }
    };
};
