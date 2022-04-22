import { gql, GraphQLClient } from 'graphql-request';
import { useGlobalAuthState } from '../Auth/UserAuth';

const graphlqlEndpoint = process.env.REACT_APP_GRAPHQL_ENDPOINT_PRIVATE;

const query = gql`
    query getDeploymentFlow($pipelineID: String!, $environmentID: String!, $version: String!) {
        getDeploymentFlow(pipelineID: $pipelineID, environmentID: $environmentID, version: $version) {
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
                triggerOnline
                description
                commands
                meta
                workerGroup
                active
                meta
            }
        }
    }
`;

export const useGetDeploymentFlow = () => {
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
            return res?.getDeploymentFlow;
        } catch (error) {
            return JSON.parse(JSON.stringify(error, undefined, 2)).response;
        }
    };
};
