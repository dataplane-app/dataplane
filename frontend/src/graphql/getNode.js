import { gql, GraphQLClient } from 'graphql-request';
import { useGlobalAuthState } from '../Auth/UserAuth';

const graphlqlEndpoint = import.meta.env.VITE_GRAPHQL_ENDPOINT_PRIVATE;

const query = gql`
    query getNode($nodeID: String!, $pipelineID: String!, $environmentID: String!) {
        getNode(nodeID: $nodeID, pipelineID: $pipelineID, environmentID: $environmentID) {
            nodeID
            pipelineID
            name
            environmentID
            nodeType
            nodeTypeDesc
            triggerOnline
            description
            commands
            meta
            workerGroup
            active
            meta
        }
    }
`;

export const useGetNode = () => {
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
            return res?.getNode;
        } catch (error) {
            return JSON.parse(JSON.stringify(error, undefined, 2)).response;
        }
    };
};
