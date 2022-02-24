import { gql, GraphQLClient } from 'graphql-request';
import { useGlobalAuthState } from '../Auth/UserAuth';

const graphlqlEndpoint = process.env.REACT_APP_GRAPHQL_ENDPOINT_PRIVATE;

const query = gql`
    query getPipelineFlow($pipelineID: String!, $environmentID: String!) {
        getPipelineFlow(pipelineID: $pipelineID, environmentID: $environmentID) {
            edges {
                edgeID
                pipelineID
                from
                to
                environmentID
                active
                meta
            }
            nodes {
                nodeID
                pipelineID
                name
                environmentID
                nodeType
                nodeTypeDesc
                description
                active
                meta
            }
        }
    }
`;

export const useGetPipelineFlow = () => {
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
            return res?.getPipelineFlow;
        } catch (error) {
            return JSON.parse(JSON.stringify(error, undefined, 2)).response;
        }
    };
};
