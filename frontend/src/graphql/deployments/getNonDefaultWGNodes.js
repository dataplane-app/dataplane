import { gql, GraphQLClient } from 'graphql-request';
import { useGlobalAuthState } from '../../Auth/UserAuth.jsx';

const graphlqlEndpoint = import.meta.env.VITE_GRAPHQL_ENDPOINT_PRIVATE;

const query = gql`
    query getNonDefaultWGNodes($toEnvironmentID: String!, $fromEnvironmentID: String!, $pipelineID: String!) {
        getNonDefaultWGNodes(toEnvironmentID: $toEnvironmentID, fromEnvironmentID: $fromEnvironmentID, pipelineID: $pipelineID) {
            nodeID
            pipelineID
            version
            name
            environmentID
            nodeType
            nodeTypeDesc
            triggerOnline
            description
            workerGroup
            deployWorkerGroup
            active
        }
    }
`;

export const useGetNonDefaultWGNodes = () => {
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
            return res?.getNonDefaultWGNodes;
        } catch (error) {
            return JSON.parse(JSON.stringify(error, undefined, 2)).response;
        }
    };
};
